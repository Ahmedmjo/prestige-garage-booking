import { NextRequest, NextResponse } from 'next/server'
import { firewall, applySecurityHeaders, getRateLimitStats, getBlockedIPs } from '@/lib/firewall'

// GET /api/firewall/status — check firewall status (admin only)
export async function GET(req: NextRequest) {
  const check = await firewall(req)
  if (check.blocked) return check.response!

  // Simple admin secret (in production, use proper auth)
  const authHeader = req.headers.get('authorization')
  const adminSecret = process.env.ADMIN_SECRET || 'prestige-admin-2026'

  if (authHeader !== `Bearer ${adminSecret}`) {
    const response = NextResponse.json(
      { error: 'Unauthorized', code: 'ADMIN_REQUIRED' },
      { status: 401 }
    )
    return applySecurityHeaders(response)
  }

  const response = NextResponse.json({
    status: 'active',
    timestamp: new Date().toISOString(),
    rateLimit: getRateLimitStats(),
    blockedIPs: getBlockedIPs(),
    config: {
      maxRequests: 100,
      maxStrictRequests: 20,
      windowMs: 60000,
      maxBodySize: '1MB',
    },
  })
  return applySecurityHeaders(response)
}
