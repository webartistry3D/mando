import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const DEFAULT_EXPENSE_CATEGORIES = [
  'Inventory',
  'Transport',
  'Fuel',
  'Rent',
  'Utilities',
  'Salaries',
  'Marketing',
  'Equipment',
  'Repairs',
  'Logistics',
  'Other',
];

async function main() {
  console.log('Seeding default expense categories...');

  // Find or create a demo business to attach categories to
  let business = await prisma.business.findFirst({
    where: { name: 'Demo Business' },
  });

  if (!business) {
    business = await prisma.business.create({
      data: {
        name: 'Demo Business',
        email: 'demo@mando.app',
        phone: '+2348000000000',
        settings: {
          create: {
            currency: 'NGN',
            invoicePrefix: 'INV',
            estimatePrefix: 'EST',
            deliveryPrefix: 'DEL',
            taxEnabled: false,
            taxRate: 0,
          },
        },
      },
    });
    console.log(`Created demo business: ${business.id}`);
  }

  // Seed expense categories
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    await prisma.expenseCategory.upsert({
      where: {
        businessId_name: {
          businessId: business.id,
          name,
        },
      },
      update: {},
      create: {
        businessId: business.id,
        name,
      },
    });
  }

  console.log(`Seeded ${DEFAULT_EXPENSE_CATEGORIES.length} expense categories for business ${business.id}`);
  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
