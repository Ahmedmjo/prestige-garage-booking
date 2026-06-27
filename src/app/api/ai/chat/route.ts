import { NextRequest, NextResponse } from 'next/server'
import { chatWithAssistant } from '@/lib/ai-assistant'
import { firewall, applySecurityHeaders, sanitizeInput } from '@/lib/firewall'

// POST /api/ai/chat — chat with Prestige AI Assistant (Protected by Firewall)
export async function POST(req: NextRequest) {
  // ─── Firewall Check ─────────────────────────────────────
  const check = await firewall(req)
  if (check.blocked) return check.response!

  try {
    const body = await req.json()

    // Sanitize input
    const message = sanitizeInput(body.message)
    const history = Array.isArray(body.history) ? sanitizeInput(body.history) : []

    if (!message || typeof message !== 'string') {
      const response = NextResponse.json(
        { error: 'الرسالة مطلوبة', code: 'INVALID_MESSAGE' },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    // Max message length to prevent abuse
    if (message.length > 2000) {
      const response = NextResponse.json(
        { error: 'الرسالة طويلة جداً (الحد الأقصى 2000 حرف)', code: 'MESSAGE_TOO_LONG' },
        { status: 400 }
      )
      return applySecurityHeaders(response)
    }

    const result = await chatWithAssistant(message, history)

    const response = NextResponse.json({
      reply: result.reply,
      intent: result.intent,
      provider: result.provider || 'z-ai-glm',
      timestamp: new Date().toISOString(),
    })
    return applySecurityHeaders(response)
  } catch (e: any) {
    console.error('AI chat API error:', e)
    const response = NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الطلب', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
    return applySecurityHeaders(response)
  }
}

// GET /api/ai/chat — get conversation history (Protected)
export async function GET(req: NextRequest) {
  const check = await firewall(req)
  if (check.blocked) return check.response!

  try {
    const { db } = await import('@/lib/db')
    const conversations = await db.aiConversation.findMany({
      orderBy: { timestamp: 'desc' },
      take: 50,
    })
    const response = NextResponse.json(conversations)
    return applySecurityHeaders(response)
  } catch (e: any) {
    const response = NextResponse.json(
      { error: e.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
    return applySecurityHeaders(response)
  }
}
