/**
 * Fix service types in the database:
 * - "دتيلنج" → "ديتيلنج"
 * - "فيلم حماية" → "بروتيكشن"
 * - "أإزالة قطران" → "إزالة قطران"
 * Also unify stock names.
 */
import { db } from '../src/lib/db'

async function main() {
  console.log('🔧 Fixing service types...\n')

  const services = await db.service.findMany()
  let fixed = 0

  for (const s of services) {
    let newType = s.serviceType
    let newCategory = s.serviceCategory || s.serviceType
    let changed = false

    // Fix "دتيلنج" → "ديتيلنج"
    if (newType.includes('دتيلنج')) {
      newType = newType.replace(/دتيلنج/g, 'ديتيلنج')
      changed = true
    }
    if (newCategory.includes('دتيلنج')) {
      newCategory = newCategory.replace(/دتيلنج/g, 'ديتيلنج')
      changed = true
    }

    // Fix "أإزالة" → "إزالة"
    if (newType.includes('أإزالة')) {
      newType = newType.replace(/أإزالة/g, 'إزالة')
      changed = true
    }

    // Fix "فيلم حماية" → "بروتيكشن"
    if (newType.includes('فيلم حماية')) {
      newType = newType.replace(/فيلم حماية/g, 'بروتيكشن')
      changed = true
    }
    if (newCategory.includes('فيلم حماية')) {
      newCategory = newCategory.replace(/فيلم حماية/g, 'بروتيكشن')
      changed = true
    }

    if (changed) {
      await db.service.update({
        where: { id: s.id },
        data: { serviceType: newType, serviceCategory: newCategory },
      })
      console.log(`  ✓ ${s.code}: "${s.serviceType}" → "${newType}"`)
      fixed++
    }
  }

  console.log(`\n✅ Fixed ${fixed} services`)

  // Also fix stock items: "دتيلنج" → "ديتيلنج" in category labels
  console.log('\n📦 Fixing stock categories...')
  const stockItems = await db.stockItem.findMany({ where: { category: 'detailing' } })
  console.log(`  Found ${stockItems.length} detailing items (category is internal key, no change needed)`)

  // Verify the changes
  const fixedServices = await db.service.findMany()
  console.log('\n📊 Verification — unique service types:')
  const types = new Set(fixedServices.map(s => s.serviceType))
  for (const t of Array.from(types).sort()) {
    const count = fixedServices.filter(s => s.serviceType === t).length
    console.log(`  ${t}: ${count}`)
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('❌ Failed:', e)
    process.exit(1)
  })
