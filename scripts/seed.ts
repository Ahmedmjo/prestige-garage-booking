/**
 * Seed Prestige Garage database from extracted JSON.
 * Run: bun run scripts/seed.ts
 */
import { db } from '../src/lib/db'
import seedData from './seed_data.json'

function toDate(s?: string | null): Date | null {
  if (!s) return null
  // Support "2026-04-19" and "08/07/2025" (dd/mm/yyyy)
  if (s.includes('/')) {
    const [dd, mm, yyyy] = s.split('/')
    return new Date(`${yyyy}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`)
  }
  return new Date(s)
}

function toFloat(v: any): number {
  if (v === null || v === undefined || v === '') return 0
  const n = Number(v)
  return isNaN(n) ? 0 : n
}

async function main() {
  console.log('🚀 Seeding Prestige Garage database...\n')

  // ── 1. ROLLS ──────────────────────────────────────────
  console.log(`🎞️  Seeding ${seedData.rolls.length} rolls...`)
  for (const r of seedData.rolls) {
    const totalLen = toFloat(r.total_length)
    const price = toFloat(r.price)
    // Compute remaining length from consumptions
    const consumptionsForRoll = seedData.consumptions.filter(c => c.roll_code === r.code)
    const consumed = consumptionsForRoll.reduce((sum, c) => sum + toFloat(c.meters_used) + toFloat(c.waste), 0)
    const remaining = Math.max(0, totalLen - consumed)
    let status = 'active'
    if (remaining <= 0) status = 'finished'
    else if (remaining <= 2) status = 'low'

    await db.roll.upsert({
      where: { code: r.code },
      update: {},
      create: {
        code: r.code,
        brand: r.brand || '',
        type: r.type || '',
        model: r.model,
        width: r.width ? toFloat(r.width) : null,
        totalLength: totalLen,
        remainingLength: remaining,
        price,
        supplier: r.supplier,
        purchaseDate: toDate(r.purchase_date),
        notes: r.notes,
        status,
      },
    })
  }

  // ── 2. ROLL CONSUMPTIONS ──────────────────────────────
  console.log(`✂️  Seeding ${seedData.consumptions.length} roll consumptions...`)
  for (const c of seedData.consumptions) {
    const roll = await db.roll.findUnique({ where: { code: c.roll_code || '' } })
    if (!roll) {
      console.warn(`   ⚠️  Roll ${c.roll_code} not found, skipping consumption`)
      continue
    }
    await db.rollConsumption.create({
      data: {
        rollId: roll.id,
        rollCode: c.roll_code || '',
        date: toDate(c.date) || new Date(),
        clientName: c.client_name,
        carType: c.car_type,
        plateNumber: c.plate_number,
        metersUsed: toFloat(c.meters_used),
        waste: toFloat(c.waste),
        usageArea: c.usage_area,
        workOrder: c.work_order,
        notes: c.notes,
        technician: null,
        transactionType: c.transaction_type || 'استهلاك',
      },
    })
  }

  // ── 3. EMPLOYEES ──────────────────────────────────────
  console.log(`👷 Seeding ${seedData.employees.length} employees...`)
  for (const e of seedData.employees) {
    await db.employee.upsert({
      where: { name: e.name },
      update: {},
      create: {
        name: e.name,
        baseSalary: toFloat(e.base_salary),
        phone: e.phone ? String(e.phone) : null,
        hireDate: toDate(e.hire_date),
        jobTitle: e.job_title,
        status: e.status || 'نشط',
        notes: e.notes,
      },
    })
  }

  // ── 4. ATTENDANCE (June 2026) ─────────────────────────
  console.log(`📅 Seeding ${seedData.attendance.length} attendance records...`)
  for (const a of seedData.attendance) {
    const emp = await db.employee.findUnique({ where: { name: a.employee_name } })
    if (!emp) continue
    const date = toDate(a.date)
    if (!date) continue
    await db.attendance.upsert({
      where: { employeeId_date: { employeeId: emp.id, date } },
      update: {},
      create: {
        employeeId: emp.id,
        employeeName: emp.name,
        date,
        status: a.status || 'غ',
        month: a.month || 6,
        year: a.year || 2026,
        notes: a.day_name,
      },
    })
  }

  // ── 5. ADVANCES ───────────────────────────────────────
  console.log(`💳 Seeding ${seedData.advances.length} advances...`)
  for (const adv of seedData.advances) {
    const emp = await db.employee.findUnique({ where: { name: adv.employee_name } })
    if (!emp) continue
    await db.advance.create({
      data: {
        employeeId: emp.id,
        employeeName: emp.name,
        date: toDate(adv.date) || new Date(),
        amount: toFloat(adv.amount),
        notes: adv.notes,
        month: adv.month || 0,
        year: adv.year || 0,
      },
    })
  }

  // ── 6. COMMISSIONS (from services log) ────────────────
  console.log(`🔧 Seeding ${seedData.commissions.length} commissions...`)
  for (const c of seedData.commissions) {
    const emp = await db.employee.findUnique({ where: { name: c.technician } })
    if (!emp) {
      // Try fuzzy match - if not found, create a placeholder commission record
      // with employeeId pointing to the manager or skip
      continue
    }
    const dt = toDate(c.date) || new Date()
    await db.commission.create({
      data: {
        employeeId: emp.id,
        employeeName: emp.name,
        date: dt,
        month: dt.getMonth() + 1,
        year: dt.getFullYear(),
        monthLabel: c.month ? String(c.month) : null,
        clientName: c.client_name,
        carType: c.car_type,
        serviceType: c.service_type,
        serviceCategory: c.service_category,
        amount: toFloat(c.amount),
        notes: c.notes,
      },
    })
  }

  // ── 7. STOCK ITEMS ────────────────────────────────────
  console.log(`📦 Seeding ${seedData.stock_items.length} stock items...`)
  for (const s of seedData.stock_items) {
    const currentQty = toFloat(s.current_qty)
    const minLevel = toFloat(s.min_level)
    let status = 'كافي'
    if (currentQty <= 0) status = 'نفد'
    else if (currentQty < minLevel) status = 'منخفض'

    await db.stockItem.create({
      data: {
        name: s.name,
        category: s.category || 'أخرى',
        unit: s.unit || 'وحدة',
        totalReceived: toFloat(s.total_received),
        totalWithdrawn: toFloat(s.total_withdrawn),
        currentQty,
        minLevel,
        status,
        unitPrice: toFloat(s.unit_price),
      },
    })
  }

  // ── 8. STOCK MOVEMENTS ────────────────────────────────
  console.log(`🔄 Seeding ${seedData.stock_movements.length} stock movements...`)
  for (const m of seedData.stock_movements) {
    // Try to find matching stock item by name (loose match)
    const item = await db.stockItem.findFirst({ where: { name: { contains: m.item_name?.split(' (')[0] || '' } } })
    await db.stockMovement.create({
      data: {
        itemId: item?.id || null,
        itemName: m.item_name || '',
        date: toDate(m.date) || new Date(),
        materialType: m.material_type,
        movementType: m.movement_type || 'استلام',
        quantity: toFloat(m.quantity),
        unit: m.unit,
        unitPrice: toFloat(m.unit_price),
        totalCost: toFloat(m.total_cost),
        notes: m.notes,
        deliveryNote: m.delivery_note ? String(m.delivery_note) : null,
      },
    })
  }

  // ── 9. SERVICES ───────────────────────────────────────
  console.log(`🔧 Seeding ${seedData.services.length} services...`)
  for (const sv of seedData.services) {
    await db.service.create({
      data: {
        code: sv.code,
        date: toDate(sv.date) || new Date(),
        plate: sv.plate ? String(sv.plate) : null,
        clientName: sv.client_name,
        carType: sv.car_type,
        serviceType: sv.service_type || 'أخرى',
        serviceCategory: sv.service_type, // will map later
        price: toFloat(sv.price),
        paymentMethod: sv.payment_method,
        technician: sv.technician,
        notes: sv.notes,
      },
    })
  }

  // ── 10. INVOICES ──────────────────────────────────────
  console.log(`🧾 Seeding ${seedData.invoices.length} invoices...`)
  for (const inv of seedData.invoices) {
    await db.invoice.create({
      data: {
        deliveryNote: inv.delivery_note,
        date: toDate(inv.date),
        description: inv.description,
        total: toFloat(inv.total),
        discount: toFloat(inv.discount),
        net: toFloat(inv.net),
        itemsCount: inv.items_count || 0,
        notes: inv.notes,
      },
    })
  }

  // ── 11. AUTO-GENERATE ALERTS ──────────────────────────
  console.log(`🔔 Generating smart alerts...`)
  const lowRolls = await db.roll.findMany({ where: { status: { in: ['low', 'finished'] } } })
  for (const r of lowRolls) {
    await db.alert.create({
      data: {
        type: 'roll_low',
        severity: r.status === 'finished' ? 'critical' : 'warning',
        title: `رول ${r.code} ${r.status === 'finished' ? 'منتهي' : 'أوشك على النفاذ'}`,
        message: `الرول ${r.brand} ${r.type} (${r.code}) — المتبقي ${r.remainingLength} متر`,
        relatedId: r.id,
        relatedType: 'roll',
      },
    })
  }

  const lowStock = await db.stockItem.findMany({ where: { status: { in: ['منخفض', 'نفد'] } } })
  for (const s of lowStock) {
    await db.alert.create({
      data: {
        type: 'low_stock',
        severity: s.status === 'نفد' ? 'critical' : 'warning',
        title: `مخزون ${s.name} ${s.status}`,
        message: `الصنف ${s.name} (${s.category}) — الكمية الحالية ${s.currentQty} ${s.unit}`,
        relatedId: s.id,
        relatedType: 'stock_item',
      },
    })
  }

  // ── SUMMARY ───────────────────────────────────────────
  const counts = {
    rolls: await db.roll.count(),
    consumptions: await db.rollConsumption.count(),
    employees: await db.employee.count(),
    attendance: await db.attendance.count(),
    advances: await db.advance.count(),
    commissions: await db.commission.count(),
    stockItems: await db.stockItem.count(),
    stockMovements: await db.stockMovement.count(),
    services: await db.service.count(),
    invoices: await db.invoice.count(),
    alerts: await db.alert.count(),
  }
  console.log('\n✅ Seed complete! Counts:')
  console.table(counts)
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
