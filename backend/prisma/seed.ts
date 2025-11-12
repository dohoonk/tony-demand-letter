import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Seed firm settings with default values
  const firmSettings = await prisma.firmSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      firmName: 'Your Law Firm Name',
      address: '123 Legal Street, Suite 100',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      phone: '(555) 123-4567',
      email: 'contact@lawfirm.com',
    },
  })

  console.log('✅ Created firm settings:', firmSettings)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed error:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

