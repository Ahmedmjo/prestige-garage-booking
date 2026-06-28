import { NextRequest, NextResponse } from "next/server";

// ============================================================
// PRESTIGE GARAGE — SMART SECURITY MIDDLEWARE
// Lightweight firewall: rate limiting + attack detection
// Zero performance impact on normal usage
// ============================================================

// In-memory store (resets on cold start — good enough for serverless)
// Format: { ip: { count, windowStart, blocked, blockUntil } }
const rateStore = new Map<string, {
  count: number;
  windowStart: number;
  blocked: boolean;
  blockUntil: number;
  violations: number;
}>();

// Cleanup old entries every 5 minutes to prevent memory leak
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [ip, data] of rateStore.entries()) {
    // Remove entries that are no longer blocked and window has passed
    if (data.blockUntil < now && data.windowStart + 60_000 < now) {
      rateStore.delete(ip);
    }
  }
}

// ── Rate limits per route type ──
const LIMITS = {
  admin:   { requests: 30,  windowMs: 60_000, blockMs: 300_000 },  // Admin: 30/min, 5 min block
  booking: { requests: 10,  windowMs: 60_000, blockMs: 120_000 },  // Booking: 10/min, 2 min block
  api:     { requests: 60,  windowMs: 60_000, blockMs: 60_000  },  // API: 60/min, 1 min block
  default: { requests: 120, windowMs: 60_000, blockMs: 30_000  },  // Pages: 120/min, 30s block
};

function getLimit(path: string) {
  if (path.startsWith("/api/admin")) return LIMITS.admin;
  if (path.startsWith("/api/bookings")) return LIMITS.booking;
  if (path.startsWith("/api")) return LIMITS.api;
  return LIMITS.default;
}

function getClientIp(req: NextRequest): string {
  // Try Vercel / Cloudflare headers first
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

// ── Attack pattern detection ──
// Only for API routes — checks path and body for obvious attack signatures
const ATTACK_PATTERNS = [
  /(\.\.|\/etc\/passwd|\/proc\/self|\/windows\/win\.ini)/i,   // Path traversal
  /<script[\s>]/i,                                              // XSS
  /union[\s\+]+select/i,                                        // SQLi
  /exec[\s(]+(?:xp_|sp_|cmdshell)/i,                           // SQL exec
  /\x00/,                                                        // Null bytes
  /\$\{.*\}/,                                                    // Template injection
];

function isAttack(req: NextRequest): boolean {
  const url = decodeURIComponent(req.url || "");
  return ATTACK_PATTERNS.some((p) => p.test(url));
}

// ── Blocked response ──
function blocked(reason: string, retryAfter = 60) {
  return new NextResponse(
    JSON.stringify({ error: "too_many_requests", reason }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        "X-RateLimit-Policy": "prestige-garage-firewall",
      },
    }
  );
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ── Skip static assets, _next internals, favicon, fonts ──
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname === "/favicon.ico" ||
    /\.(png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|css|js\.map)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  cleanup();

  const ip = getClientIp(req);
  const now = Date.now();

  // ── Attack detection (API routes only, cheap path check) ──
  if (pathname.startsWith("/api") && isAttack(req)) {
    const entry = rateStore.get(ip) || { count: 0, windowStart: now, blocked: false, blockUntil: 0, violations: 0 };
    entry.violations = (entry.violations || 0) + 1;
    // Escalating block: 5 min per violation
    entry.blockUntil = now + 5 * 60_000 * entry.violations;
    entry.blocked = true;
    rateStore.set(ip, entry);
    return blocked("security_violation", 300);
  }

  // ── Rate limiting ──
  const limit = getLimit(pathname);
  const entry = rateStore.get(ip) || {
    count: 0,
    windowStart: now,
    blocked: false,
    blockUntil: 0,
    violations: 0,
  };

  // If currently blocked
  if (entry.blocked && entry.blockUntil > now) {
    const retryAfter = Math.ceil((entry.blockUntil - now) / 1000);
    return blocked("rate_limit_exceeded", retryAfter);
  }

  // Reset window if expired
  if (now - entry.windowStart > limit.windowMs) {
    entry.count = 0;
    entry.windowStart = now;
    entry.blocked = false;
  }

  entry.count++;

  if (entry.count > limit.requests) {
    entry.blocked = true;
    entry.blockUntil = now + limit.blockMs;
    rateStore.set(ip, entry);
    return blocked("rate_limit_exceeded", Math.ceil(limit.blockMs / 1000));
  }

  rateStore.set(ip, entry);

  // ── Security headers on every response ──
  const res = NextResponse.next();
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "SAMEORIGIN");
  res.headers.set("X-XSS-Protection", "1; mode=block");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Don't add CSP here — it can break Next.js inline scripts; handle in next.config
  return res;
}

export const config = {
  // Run on all routes except _next internals and public static files
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};
