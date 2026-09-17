/// <reference types="node" />
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
  const categoryMap = new Map<string, string>();
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    const cat = await prisma.expenseCategory.upsert({
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
    categoryMap.set(name, cat.id);
  }
  console.log(`Seeded ${DEFAULT_EXPENSE_CATEGORIES.length} expense categories for business ${business.id}`);

  // Seed sample payments and expenses across the last 7 days
  const existingPayments = await prisma.payment.count({ where: { businessId: business.id } });
  if (existingPayments === 0) {
    // Find or create a walk-in customer
    let customer = await prisma.customer.findFirst({
      where: { businessId: business.id, name: 'Walk-in Customer' },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: { businessId: business.id, name: 'Walk-in Customer', type: 'INDIVIDUAL' },
      });
    }

    const now = new Date();
    const samplePayments = [
      { daysAgo: 0, amount: 15000, method: 'BANK_TRANSFER' as const },
      { daysAgo: 0, amount: 8500, method: 'CASH' as const },
      { daysAgo: 1, amount: 32000, method: 'POS' as const },
      { daysAgo: 2, amount: 12000, method: 'CASH' as const },
      { daysAgo: 2, amount: 25000, method: 'BANK_TRANSFER' as const },
      { daysAgo: 3, amount: 18000, method: 'CARD' as const },
      { daysAgo: 4, amount: 9500, method: 'CASH' as const },
      { daysAgo: 5, amount: 42000, method: 'BANK_TRANSFER' as const },
      { daysAgo: 6, amount: 22000, method: 'POS' as const },
    ];

    for (const p of samplePayments) {
      const date = new Date(now);
      date.setDate(date.getDate() - p.daysAgo);
      date.setHours(10 + p.daysAgo, 30, 0, 0);
      await prisma.payment.create({
        data: {
          businessId: business.id,
          customerId: customer.id,
          amount: p.amount,
          paymentMethod: p.method,
          paymentDate: date,
          description: 'Sample payment',
        },
      });
    }
    console.log(`Seeded ${samplePayments.length} sample payments`);

    const sampleExpenses = [
      { daysAgo: 0, amount: 5000, category: 'Fuel' },
      { daysAgo: 0, amount: 3000, category: 'Transport' },
      { daysAgo: 1, amount: 15000, category: 'Inventory' },
      { daysAgo: 2, amount: 8000, category: 'Utilities' },
      { daysAgo: 3, amount: 12000, category: 'Marketing' },
      { daysAgo: 4, amount: 25000, category: 'Rent' },
      { daysAgo: 5, amount: 6000, category: 'Fuel' },
      { daysAgo: 6, amount: 10000, category: 'Inventory' },
    ];

    for (const e of sampleExpenses) {
      const date = new Date(now);
      date.setDate(date.getDate() - e.daysAgo);
      date.setHours(14, 0, 0, 0);
      await prisma.expense.create({
        data: {
          businessId: business.id,
          categoryId: categoryMap.get(e.category)!,
          description: `Sample ${e.category.toLowerCase()} expense`,
          amount: e.amount,
          date,
          vendor: 'Sample Vendor',
        },
      });
    }
    console.log(`Seeded ${sampleExpenses.length} sample expenses`);
  }

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
