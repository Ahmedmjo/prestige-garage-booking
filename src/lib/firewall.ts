/**
 * 🔒 Prestige Garage Firewall — Multi-layer Security System
 *
 * Layers:
 * 1. Rate Limiting (in-memory, per-IP)
 * 2. IP Blacklist/Whitelist
 * 3. Input Sanitization & XSS Prevention
 * 4. SQL Injection Detection
 * 5. Bot/Scanner Detection
 * 6. Request Size Limiting
 * 7. Security Headers
 *
 * Usage in any API route:
 *   import { firewall, FirewallResponse } from '@/lib/firewall'
 *   export async function POST(req: Request) {
 *     const check = await firewall(req)
 *     if (check.blocked) return check.response!
 *     // ... your logic
 *   }
 */

import { NextResponse } from 'next/server'

// ════════════════════════════════════════════════════════════════
// CONFIGURATION
// ════════════════════════════════════════════════════════════════

const CONFIG = {
  // Rate limiting: max requests per window
  RATE_LIMIT_MAX: 100,            // max requests
  RATE_LIMIT_WINDOW_MS: 60_000,   // per minute
  RATE_LIMIT_STRICT_MAX: 20,      // for POST/PUT/DELETE
  RATE_LIMIT_STRICT_WINDOW_MS: 60_000,

  // Max request body size (bytes) — 1MB
  MAX_BODY_SIZE: 1024 * 1024,

  // Blocked IPs (add malicious IPs here)
  IP_BLACKLIST: new Set<string>([
    // '123.45.67.89',  // example
  ]),

  // Allowed origins (empty = allow all in dev, restrict in prod)
  ALLOWED_ORIGINS: new Set<string>([
    // Add your production domain: 'https://prestige-garage.vercel.app'
  ]),

  // Suspicious user agents (bots, scanners)
  BLOCKED_USER_AGENTS: [
    'sqlmap', 'nikto', 'nmap', 'masscan', 'dirb', 'gobuster',
    'wpscan', 'hydra', 'burp', 'owasp', 'zap',
    'acunetix', 'netsparker', 'appscan', 'paros',
  ],

  // SQL injection patterns
  SQL_INJECTION_PATTERNS: [
    /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b).*(\bfrom\b|\binto\b|\btable\b)/i,
    /'.*OR.*'.*=.*'/i,
    /".*OR.*".*=.*"/i,
    /;\s*(drop|delete|update|insert|create|alter)\s/i,
    /--\s*$/m,
    /\/\*.*\*\//,
    /\bxp_cmdshell\b/i,
    /\bexec(ute)?\s*\(/i,
    /\bwaitfor\s+delay\b/i,
  ],

  // XSS patterns
  XSS_PATTERNS: [
    /<script[^>]*>.*?<\/script>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /javascript:\s*[^,]/i,
    /on(load|error|click|mouseover|focus|blur)\s*=/i,
    /<img[^>]+src\s*=\s*["']?javascript:/i,
    /<svg[^>]*onload\s*=/i,
    /eval\s*\(/i,
    /document\.cookie/i,
    /window\.location\s*=/i,
  ],

  // Path traversal patterns
  PATH_TRAVERSAL_PATTERNS: [
    /\.\.\//,
    /\.\.\\/,
    /%2e%2e%2f/i,
    /%2e%2e\//i,
    /\.\.%2f/i,
    /etc\/passwd/i,
    /windows\/system32/i,
  ],
}

// ════════════════════════════════════════════════════════════════
// RATE LIMITING (in-memory store)
// ════════════════════════════════════════════════════════════════

interface RateLimitEntry {
  count: number
  strictCount: number
  resetTime: number
  strictResetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime && now > entry.strictResetTime) {
      rateLimitStore.delete(ip)
    }
  }
}, 5 * 60 * 1000)

function checkRateLimit(ip: string, isStrict: boolean): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now()
  let entry = rateLimitStore.get(ip)

  if (!entry) {
    entry = {
      count: 0,
      strictCount: 0,
      resetTime: now + CONFIG.RATE_LIMIT_WINDOW_MS,
      strictResetTime: now + CONFIG.RATE_LIMIT_STRICT_WINDOW_MS,
    }
    rateLimitStore.set(ip, entry)
  }

  // Reset window if expired
  if (now > entry.resetTime) {
    entry.count = 0
    entry.resetTime = now + CONFIG.RATE_LIMIT_WINDOW_MS
  }
  if (now > entry.strictResetTime) {
    entry.strictCount = 0
    entry.strictResetTime = now + CONFIG.RATE_LIMIT_STRICT_WINDOW_MS
  }

  if (isStrict) {
    entry.strictCount++
    if (entry.strictCount > CONFIG.RATE_LIMIT_STRICT_MAX) {
      return {
        allowed: false,
        remaining: 0,
        resetIn: Math.ceil((entry.strictResetTime - now) / 1000),
      }
    }
    return {
      allowed: true,
      remaining: CONFIG.RATE_LIMIT_STRICT_MAX - entry.strictCount,
      resetIn: Math.ceil((entry.strictResetTime - now) / 1000),
    }
  }

  entry.count++
  if (entry.count > CONFIG.RATE_LIMIT_MAX) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: Math.ceil((entry.resetTime - now) / 1000),
    }
  }

  return {
    allowed: true,
    remaining: CONFIG.RATE_LIMIT_MAX - entry.count,
    resetIn: Math.ceil((entry.resetTime - now) / 1000),
  }
}

// ════════════════════════════════════════════════════════════════
// IP EXTRACTION
// ════════════════════════════════════════════════════════════════

function getClientIP(req: Request): string {
  const headers = req.headers
  // Check Vercel's headers first
  return (
    headers.get('x-real-ip') ||
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-client-ip') ||
    headers.get('cf-connecting-ip') ||  // Cloudflare
    'unknown'
  )
}

// ════════════════════════════════════════════════════════════════
// THREAT DETECTION
// ════════════════════════════════════════════════════════════════

function detectThreats(input: string): { detected: boolean; type: string } {
  // SQL Injection
  for (const pattern of CONFIG.SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { detected: true, type: 'SQL_INJECTION' }
    }
  }

  // XSS
  for (const pattern of CONFIG.XSS_PATTERNS) {
    if (pattern.test(input)) {
      return { detected: true, type: 'XSS' }
    }
  }

  // Path traversal
  for (const pattern of CONFIG.PATH_TRAVERSAL_PATTERNS) {
    if (pattern.test(input)) {
      return { detected: true, type: 'PATH_TRAVERSAL' }
    }
  }

  return { detected: false, type: '' }
}

function isBotScanner(userAgent: string): boolean {
  const ua = userAgent.toLowerCase()
  return CONFIG.BLOCKED_USER_AGENTS.some(bot => ua.includes(bot))
}

// ════════════════════════════════════════════════════════════════
// INPUT SANITIZATION
// ════════════════════════════════════════════════════════════════

export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/<script[^>]*>.*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')  // strip HTML tags
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
      .slice(0, 10000)  // max length
  }
  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }
  if (input && typeof input === 'object') {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      // Prevent prototype pollution
      if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }
  return input
}

// ════════════════════════════════════════════════════════════════
// SECURITY HEADERS
// ════════════════════════════════════════════════════════════════

export function applySecurityHeaders(response: NextResponse): NextResponse {
  // Prevent clickjacking
  response.headers.set('X-Frame-Options', 'DENY')

  // Prevent MIME-type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Force HTTPS (1 year)
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ')
  )

  // Referrer policy
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')

  // Disable caching for API responses
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, private')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}

// ════════════════════════════════════════════════════════════════
// MAIN FIREWALL FUNCTION
// ════════════════════════════════════════════════════════════════

export interface FirewallResult {
  blocked: boolean
  response?: NextResponse
  ip: string
  reason?: string
}

export async function firewall(req: Request): Promise<FirewallResult> {
  const ip = getClientIP(req)
  const method = req.method.toUpperCase()
  const userAgent = req.headers.get('user-agent') || ''
  const url = new URL(req.url)

  // ─── Layer 1: IP Blacklist ─────────────────────────────
  if (CONFIG.IP_BLACKLIST.has(ip)) {
    return {
      blocked: true,
      ip,
      reason: 'IP blacklisted',
      response: NextResponse.json(
        { error: 'Access denied', code: 'IP_BLOCKED' },
        { status: 403 }
      ),
    }
  }

  // ─── Layer 2: Bot/Scanner Detection ────────────────────
  if (isBotScanner(userAgent)) {
    return {
      blocked: true,
      ip,
      reason: 'Bot/scanner detected',
      response: NextResponse.json(
        { error: 'Access denied', code: 'BOT_DETECTED' },
        { status: 403 }
      ),
    }
  }

  // ─── Layer 3: Rate Limiting ────────────────────────────
  const isStrict = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)
  const rateCheck = checkRateLimit(ip, isStrict)
  if (!rateCheck.allowed) {
    return {
      blocked: true,
      ip,
      reason: `Rate limit exceeded (${method})`,
      response: NextResponse.json(
        {
          error: 'Too many requests',
          code: 'RATE_LIMITED',
          retryAfter: rateCheck.resetIn,
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateCheck.resetIn),
            'X-RateLimit-Limit': String(isStrict ? CONFIG.RATE_LIMIT_STRICT_MAX : CONFIG.RATE_LIMIT_MAX),
            'X-RateLimit-Remaining': '0',
          },
        }
      ),
    }
  }

  // ─── Layer 4: URL-based Threat Detection ───────────────
  const urlThreat = detectThreats(url.pathname + url.search)
  if (urlThreat.detected) {
    return {
      blocked: true,
      ip,
      reason: `Threat detected: ${urlThreat.type}`,
      response: NextResponse.json(
        { error: 'Invalid request', code: urlThreat.type },
        { status: 400 }
      ),
    }
  }

  // ─── Layer 5: Body Size Limit ──────────────────────────
  const contentLength = parseInt(req.headers.get('content-length') || '0')
  if (contentLength > CONFIG.MAX_BODY_SIZE) {
    return {
      blocked: true,
      ip,
      reason: 'Body too large',
      response: NextResponse.json(
        { error: 'Request body too large', code: 'BODY_TOO_LARGE', maxSize: CONFIG.MAX_BODY_SIZE },
        { status: 413 }
      ),
    }
  }

  // ─── Layer 6: Body Threat Detection (for POST/PUT/PATCH) ───
  if (['POST', 'PUT', 'PATCH'].includes(method) && contentLength > 0) {
    try {
      const body = await req.json()
      const bodyStr = JSON.stringify(body)
      const bodyThreat = detectThreats(bodyStr)
      if (bodyThreat.detected) {
        return {
          blocked: true,
          ip,
          reason: `Body threat: ${bodyThreat.type}`,
          response: NextResponse.json(
            { error: 'Invalid input detected', code: bodyThreat.type },
            { status: 400 }
          ),
        }
      }
    } catch {
      // Body is not JSON, skip JSON threat detection
    }
  }

  // ─── All checks passed ─────────────────────────────────
  return { blocked: false, ip }
}

// ════════════════════════════════════════════════════════════════
// MIDDLEWARE for Next.js (applied to all routes)
// ════════════════════════════════════════════════════════════════

export function middleware(req: Request): NextResponse {
  // Quick security headers on all responses
  const response = NextResponse.next()
  applySecurityHeaders(response)
  return response
}

// ════════════════════════════════════════════════════════════════
// HELPER: Block IP (can be called dynamically)
// ════════════════════════════════════════════════════════════════

export function blockIP(ip: string) {
  CONFIG.IP_BLACKLIST.add(ip)
}

export function unblockIP(ip: string) {
  CONFIG.IP_BLACKLIST.delete(ip)
}

export function getBlockedIPs(): string[] {
  return Array.from(CONFIG.IP_BLACKLIST)
}

export function getRateLimitStats() {
  return {
    totalTrackedIPs: rateLimitStore.size,
    entries: Array.from(rateLimitStore.entries()).map(([ip, entry]) => ({
      ip,
      requests: entry.count,
      strictRequests: entry.strictCount,
    })),
  }
}
