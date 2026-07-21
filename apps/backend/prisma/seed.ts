import { CalculationMethod, PrismaClient, RecurrenceType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { slugify } from '../src/common/slugify';
import { generateDueDates } from '../src/modules/contracts/installments/recurrence';
import { calculateInstallmentSchedule } from '../src/modules/contracts/installments/schedule';

const prisma = new PrismaClient();

const SEED_TENANT_NAME = 'Demo Business';
const SEED_ADMIN_EMAIL = 'admin@demo.com';
const SEED_ADMIN_PASSWORD = 'password123';

function toUtcMidnight(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

interface CustomerSeed {
  name: string;
  phone: string;
  address?: string;
}

interface PaymentSeed {
  installmentSequence: number;
  amount: number;
  paidAtOffsetDays: number;
}

interface ContractSeed {
  customerIndex: number;
  productName: string;
  productPrice: number;
  downPayment: number;
  calculationMethod: CalculationMethod;
  markupPercent?: number;
  installmentCount?: number;
  fixedInstallmentAmount?: number;
  recurrenceType: RecurrenceType;
  firstPaymentDateOffsetDays: number;
  payments: PaymentSeed[];
  cancelled?: boolean;
}

const CUSTOMER_SEEDS: CustomerSeed[] = [
  { name: 'Ahmed Hassan', phone: '01012345678', address: '12 Nile St, Cairo' },
  { name: 'Sara Mohamed', phone: '01098765432', address: '5 Tahrir Sq, Cairo' },
  { name: 'Omar Ali', phone: '01055512345', address: '88 Corniche Rd, Alexandria' },
  { name: 'Mona Ibrahim', phone: '01011122233' },
  { name: 'Youssef Khaled', phone: '01099988877', address: '3 Zamalek St, Cairo' },
  { name: 'Layla Ahmed', phone: '01077766655' },
];

const CONTRACT_SEEDS: ContractSeed[] = [
  {
    customerIndex: 0,
    productName: 'Samsung Refrigerator',
    productPrice: 100_000,
    downPayment: 20_000,
    calculationMethod: 'FIXED_COUNT',
    installmentCount: 8,
    recurrenceType: 'WEEKLY',
    firstPaymentDateOffsetDays: -21,
    payments: [
      { installmentSequence: 1, amount: 10_000, paidAtOffsetDays: -20 },
      { installmentSequence: 2, amount: 6_000, paidAtOffsetDays: -13 },
    ],
  },
  {
    customerIndex: 1,
    productName: 'LG Smart TV 55"',
    productPrice: 200_000,
    downPayment: 30_000,
    calculationMethod: 'MARKUP_PERCENT',
    markupPercent: 15,
    installmentCount: 10,
    recurrenceType: 'MONTHLY',
    firstPaymentDateOffsetDays: -60,
    payments: [
      { installmentSequence: 1, amount: 20_000, paidAtOffsetDays: -58 },
      { installmentSequence: 2, amount: 20_000, paidAtOffsetDays: -28 },
    ],
  },
  {
    customerIndex: 2,
    productName: 'Dining Room Set',
    productPrice: 300_000,
    downPayment: 50_000,
    calculationMethod: 'FIXED_AMOUNT',
    fixedInstallmentAmount: 50_000,
    recurrenceType: 'MONTHLY',
    firstPaymentDateOffsetDays: 5,
    payments: [],
  },
  {
    customerIndex: 3,
    productName: 'Washing Machine',
    productPrice: 80_000,
    downPayment: 0,
    calculationMethod: 'FIXED_COUNT',
    installmentCount: 4,
    recurrenceType: 'BIWEEKLY',
    firstPaymentDateOffsetDays: -40,
    payments: [],
    cancelled: true,
  },
  {
    customerIndex: 4,
    productName: 'Microwave Oven',
    productPrice: 30_000,
    downPayment: 0,
    calculationMethod: 'FIXED_COUNT',
    installmentCount: 3,
    recurrenceType: 'MONTHLY',
    firstPaymentDateOffsetDays: -90,
    payments: [
      { installmentSequence: 1, amount: 10_000, paidAtOffsetDays: -89 },
      { installmentSequence: 2, amount: 10_000, paidAtOffsetDays: -59 },
      { installmentSequence: 3, amount: 10_000, paidAtOffsetDays: -29 },
    ],
  },
];

async function seedContract(tenantId: string, customerId: string, contractSeed: ContractSeed, today: Date): Promise<void> {
  const firstPaymentDate = addUtcDays(today, contractSeed.firstPaymentDateOffsetDays);

  const schedule = calculateInstallmentSchedule({
    calculationMethod: contractSeed.calculationMethod,
    productPrice: contractSeed.productPrice,
    downPayment: contractSeed.downPayment,
    markupPercent: contractSeed.markupPercent,
    installmentCount: contractSeed.installmentCount,
    fixedInstallmentAmount: contractSeed.fixedInstallmentAmount,
  });

  const dueDates = generateDueDates({
    firstPaymentDate,
    recurrenceType: contractSeed.recurrenceType,
    installmentCount: schedule.installmentAmounts.length,
  });

  const contract = await prisma.contract.create({
    data: {
      tenantId,
      customerId,
      productName: contractSeed.productName,
      productPrice: contractSeed.productPrice,
      downPayment: contractSeed.downPayment,
      totalAmount: schedule.totalAmount,
      calculationMethod: contractSeed.calculationMethod,
      markupPercent: contractSeed.markupPercent,
      installmentCount: schedule.installmentAmounts.length,
      recurrenceType: contractSeed.recurrenceType,
      startDate: firstPaymentDate,
      firstPaymentDate,
    },
  });

  const installments = await Promise.all(
    schedule.installmentAmounts.map((amount, index) =>
      prisma.installment.create({
        data: {
          tenantId,
          contractId: contract.id,
          sequence: index + 1,
          dueDate: dueDates[index],
          amount,
        },
      }),
    ),
  );

  for (const paymentSeed of contractSeed.payments) {
    const installment = installments[paymentSeed.installmentSequence - 1];
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        contractId: contract.id,
        amount: paymentSeed.amount,
        paidAt: addUtcDays(today, paymentSeed.paidAtOffsetDays),
      },
    });
    await prisma.paymentAllocation.create({
      data: { paymentId: payment.id, installmentId: installment.id, amount: paymentSeed.amount },
    });

    const newPaidAmount = installment.paidAmount + paymentSeed.amount;
    await prisma.installment.update({
      where: { id: installment.id },
      data: {
        paidAmount: newPaidAmount,
        status: newPaidAmount >= installment.amount ? 'PAID' : 'PARTIALLY_PAID',
      },
    });
  }

  if (contractSeed.cancelled) {
    await prisma.installment.updateMany({
      where: { contractId: contract.id, status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
      data: { status: 'CANCELLED' },
    });
    await prisma.contract.update({ where: { id: contract.id }, data: { status: 'CANCELLED' } });
    return;
  }

  const remainingCount = await prisma.installment.count({
    where: { contractId: contract.id, status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
  });
  if (remainingCount === 0) {
    await prisma.contract.update({ where: { id: contract.id }, data: { status: 'COMPLETED' } });
  }
}

async function seed(): Promise<void> {
  const existingAdmin = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } });
  if (existingAdmin) {
    console.log(`Seed skipped: ${SEED_ADMIN_EMAIL} already exists.`);
    return;
  }

  const passwordHash = await bcrypt.hash(SEED_ADMIN_PASSWORD, 10);
  const tenant = await prisma.tenant.create({
    data: {
      name: SEED_TENANT_NAME,
      slug: slugify(SEED_TENANT_NAME),
      users: { create: { name: 'Admin', email: SEED_ADMIN_EMAIL, passwordHash } },
    },
  });

  const today = toUtcMidnight(new Date());

  const customers = await Promise.all(
    CUSTOMER_SEEDS.map((customerSeed) => prisma.customer.create({ data: { tenantId: tenant.id, ...customerSeed } })),
  );

  for (const contractSeed of CONTRACT_SEEDS) {
    await seedContract(tenant.id, customers[contractSeed.customerIndex].id, contractSeed, today);
  }

  console.log(`Seeded tenant "${tenant.name}" with admin ${SEED_ADMIN_EMAIL} / ${SEED_ADMIN_PASSWORD}`);
  console.log(`Seeded ${customers.length} customers and ${CONTRACT_SEEDS.length} contracts.`);
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
