import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { firewall, applySecurityHeaders } from '@/lib/firewall'

// GET /api/ai/conversations — list all conversations
export async function GET(req: NextRequest) {
  const check = await firewall(req)
  if (check.blocked) return check.response!

  try {
    const conversations = await db.aiConversation.findMany({
      orderBy: { timestamp: 'desc' },
      take: 200,
    })
    const response = NextResponse.json(conversations)
    return applySecurityHeaders(response)
  } catch (e: any) {
    const response = NextResponse.json({ error: e.message }, { status: 500 })
    return applySecurityHeaders(response)
  }
}
