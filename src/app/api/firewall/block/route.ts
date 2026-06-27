import { NextRequest, NextResponse } from 'next/server'
import { firewall, applySecurityHeaders, blockIP } from '@/lib/firewall'

// POST /api/firewall/block — block an IP (admin only)
export async function POST(req: NextRequest) {
  const check = await firewall(req)
  if (check.blocked) return check.response!

  // Admin authentication
  const authHeader = req.headers.get('authorization')
  const adminSecret = process.env.ADMIN_SECRET || 'prestige-admin-2026'

  if (authHeader !== `Bearer ${adminSecret}`) {
    const response = NextResponse.json(
      { error: 'Unauthorized', code: 'ADMIN_REQUIRED' },
      { status: 401 }
    )
    return applySecurityHeaders(response)
  }

  try {
    const body = await req.json()
    const { ip } = body

    if (!ip || typeof ip !== 'string') {
      const response = NextResponse.json(
        { error: 'IP address required', code: 'INVALID_IP' },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    blockIP(ip)

    const response = NextResponse.json({
      success: true,
      message: `IP ${ip} has been blocked`,
      timestamp: new Date().toISOString(),
    })
    return applySecurityHeaders(response)
  } catch (e: any) {
    const response = NextResponse.json(
      { error: e.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
    return applySecurityHeaders(response)
  }
}
