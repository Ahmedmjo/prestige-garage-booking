/**
 * Prestige AI Assistant Engine
 * Handles Arabic natural-language queries about garage data.
 * Uses z-ai-web-dev-sdk for LLM + structured tool-calling against the database.
 */
import { db } from '@/lib/db'

// ─── Tool: query data context for the LLM ───────────────────────────
async function buildDataSnapshot() {
  const [
    rolls,
    employees,
    services,
    stockItems,
    invoices,
    advances,
    commissions,
    attendance,
    consumptions,
    alerts,
  ] = await Promise.all([
    db.roll.findMany(),
    db.employee.findMany({ include: { advances: true, commissions: true, attendance: true } }),
    db.service.findMany({ orderBy: { date: 'desc' }, take: 100 }),
    db.stockItem.findMany(),
    db.invoice.findMany(),
    db.advance.findMany(),
    db.commission.findMany(),
    db.attendance.findMany(),
    db.rollConsumption.findMany(),
    db.alert.findMany({ where: { isRead: false } }),
  ])

  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  // Compute payroll for current month per employee
  const payroll = employees.map(emp => {
    const monthAttendance = emp.attendance.filter(a => a.month === currentMonth && a.year === currentYear)
    const present = monthAttendance.filter(a => a.status === 'ح').length
    const officialLeave = monthAttendance.filter(a => a.status === 'إ').length
    const paidDays = present + officialLeave
    const dailyRate = emp.baseSalary / 30
    const baseEarned = dailyRate * paidDays
    const monthCommissions = emp.commissions.filter(c => c.month === currentMonth && c.year === currentYear)
    const totalCommissions = monthCommissions.reduce((s, c) => s + c.amount, 0)
    const monthAdvances = emp.advances.filter(a => a.month === currentMonth && a.year === currentYear)
    const totalAdvances = monthAdvances.reduce((s, a) => s + a.amount, 0)
    const penalties = monthAttendance.reduce((s, a) => s + (a.penalties || 0), 0)
    return {
      name: emp.name,
      jobTitle: emp.jobTitle,
      baseSalary: emp.baseSalary,
      paidDays,
      present,
      baseEarned: Math.round(baseEarned),
      totalCommissions,
      totalAdvances,
      penalties,
      netSalary: Math.round(baseEarned + totalCommissions - totalAdvances - penalties),
    }
  })

  return {
    snapshotDate: now.toISOString().split('T')[0],
    currentMonth,
    currentYear,
    rolls: rolls.map(r => ({
      code: r.code,
      brand: r.brand,
      type: r.type,
      model: r.model,
      totalLength: r.totalLength,
      remainingLength: r.remainingLength,
      price: r.price,
      supplier: r.supplier,
      status: r.status,
    })),
    employees: employees.map(e => ({
      name: e.name,
      jobTitle: e.jobTitle,
      baseSalary: e.baseSalary,
      status: e.status,
      phone: e.phone,
    })),
    payroll,
    services: services.slice(0, 50).map(s => ({
      code: s.code,
      date: s.date,
      clientName: s.clientName,
      carType: s.carType,
      serviceType: s.serviceType,
      price: s.price,
      technician: s.technician,
    })),
    servicesStats: {
      total: services.length,
      totalRevenue: services.reduce((s, x) => s + x.price, 0),
      byType: services.reduce((acc, s) => {
        const t = s.serviceType || 'أخرى'
        if (!acc[t]) acc[t] = { count: 0, total: 0 }
        acc[t].count++
        acc[t].total += s.price
        return acc
      }, {} as Record<string, { count: number; total: number }>),
    },
    stock: stockItems.map(s => ({
      name: s.name,
      category: s.category,
      unit: s.unit,
      currentQty: s.currentQty,
      minLevel: s.minLevel,
      status: s.status,
      unitPrice: s.unitPrice,
    })),
    invoices: invoices.map(i => ({
      deliveryNote: i.deliveryNote,
      date: i.date,
      description: i.description,
      total: i.total,
      discount: i.discount,
      net: i.net,
      itemsCount: i.itemsCount,
    })),
    advances: advances.slice(0, 30).map(a => ({
      employee: a.employeeName,
      date: a.date,
      amount: a.amount,
      month: a.month,
      year: a.year,
    })),
    consumptions: consumptions.slice(0, 30).map(c => ({
      date: c.date,
      rollCode: c.rollCode,
      clientName: c.clientName,
      carType: c.carType,
      metersUsed: c.metersUsed,
      waste: c.waste,
      workOrder: c.workOrder,
    })),
    alerts: alerts.map(a => ({
      type: a.type,
      severity: a.severity,
      title: a.title,
      message: a.message,
    })),
  }
}

// ─── System prompt ───────────────────────────────────────────────────
const SYSTEM_PROMPT = `أنت "مساعد برستيج" — المساعد الذكي لمركز Prestige Garage للعناية بالسيارات الفاخرة.

تتحدث بالعربية الفصحى بلهجة مصرية بسيطة. مهمتك مساعدة المدير والفنيين في:
1. الإجابة على الأسئلة حول المخزون والرواتب والإيرادات والرولات
2. تحليل البيانات وإنشاء تقارير مختصرة
3. اقتراح إجراءات ذكية بناءً على البيانات

قواعد مهمة:
- أجب بإيجاز ووضوح، استخدم الأرقام والعملة (ج.م) عند الحاجة
- إذا كان السؤال يتطلب إضافة بيانات جديدة (مثل "سجل استهلاك" أو "أضف سلفة")، اطلب التأكيد واذكر البيانات التي ستسجلها
- استخدم الرموز التعبيرية عند المناسب (🎞️ 👷 📦 🔧 💰 ⚠️ ✅)
- إذا لم تفهم السؤال، اطلب التوضيح بأدب
- عند السؤال عن مرتب موظف، اذكر التفاصيل: أيام الحضور، الأساسي المستحق، العمولات، السلفيات، الصافي
- عند السؤال عن رول، اذكر: الكود، الماركة، النوع، المتبقي، الحالة

ستحصل على لقطة بيانات حديثة (snapshot) — استخدمها للإجابة بدقة.`

// ─── Main: chat with assistant ──────────────────────────────────────
export async function chatWithAssistant(userMessage: string, conversationHistory: { role: string; content: string }[] = []) {
  try {
    const snapshot = await buildDataSnapshot()

    // Dynamically import to keep server-only
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const ai = await ZAI.create()

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'system', content: `بيانات المركز الحالية (JSON):\n${JSON.stringify(snapshot, null, 2)}` },
      ...conversationHistory.slice(-6).map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: userMessage },
    ]

    const response = await ai.chat.completions.create({
      messages,
      temperature: 0.4,
      max_tokens: 800,
    })

    const reply = response.choices[0]?.message?.content || 'عذراً، لم أتمكن من توليد رد.'

    // Save conversation
    await db.aiConversation.create({
      data: {
        userMessage,
        aiResponse: reply,
        intentType: detectIntent(userMessage),
      },
    })

    return { reply, intent: detectIntent(userMessage) }
  } catch (e: any) {
    console.error('AI Assistant error:', e)
    return {
      reply: `عذراً، حدث خطأ أثناء معالجة طلبك. ${e.message || ''}`,
      intent: 'error',
    }
  }
}

// ─── Simple intent classifier ───────────────────────────────────────
function detectIntent(message: string): string {
  const m = message.toLowerCase()
  if (/كم|ما هو|ما هي|أظهر|اعرض|قائمة|كشف|رصيد|متبقي|قيمة|حالة/.test(message)) return 'query'
  if (/سجل|أضف|ضيف|ادخل|اشتريت|استلمت/.test(message)) return 'add'
  if (/تقرير|قارن|تحليل|إحصائية|احصائية/.test(message)) return 'report'
  if (/نبه|تنبيه|تذكير/.test(message)) return 'alert'
  if (/اقترح|اقتراح|ماذا تنصح|ما رأيك/.test(message)) return 'suggestion'
  return 'query'
}
