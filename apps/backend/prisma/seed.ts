import {
  CalculationMethod,
  Contract,
  Installment,
  PaymentClaimStatus,
  PaymentDirection,
  PaymentMethod,
  PrismaClient,
  RecurrenceType,
  Role,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import { slugify } from '../src/common/slugify';
import { generateDueDates } from '../src/modules/contracts/installments/recurrence';
import { calculateInstallmentSchedule } from '../src/modules/contracts/installments/schedule';

const prisma = new PrismaClient();

const SEED_TENANT_NAME = 'Demo Business';
const SEED_ADMIN_EMAIL = 'admin@demo.com';
const SEED_STAFF_EMAIL = 'staff@demo.com';
const SEED_PASSWORD = 'password123';

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
  paymentMethodIndex?: number;
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

interface PaymentMethodSeed {
  label: string;
  details: string;
  presetKey?: string;
  monthlyLimit?: number;
  isActive?: boolean;
}

interface PaymentMethodTransactionSeed {
  paymentMethodIndex: number;
  direction: PaymentDirection;
  amount: number;
  counterpartyName?: string;
  counterpartyPhone?: string;
  receiptUrl?: string;
  note?: string;
  occurredAtOffsetDays: number;
}

interface PaymentClaimSeed {
  contractIndex: number;
  paymentMethodIndex: number;
  amount: number;
  screenshotUrl: string;
  status: PaymentClaimStatus;
  declineReason?: string;
  reviewedOffsetDays?: number;
}

const CUSTOMER_SEEDS: CustomerSeed[] = [
  { name: 'Ahmed Hassan', phone: '01012345678', address: '12 Nile St, Cairo' },
  { name: 'Sara Mohamed', phone: '01098765432', address: '5 Tahrir Sq, Cairo' },
  { name: 'Omar Ali', phone: '01055512345', address: '88 Corniche Rd, Alexandria' },
  { name: 'Mona Ibrahim', phone: '01011122233' },
  { name: 'Youssef Khaled', phone: '01099988877', address: '3 Zamalek St, Cairo' },
  { name: 'Layla Ahmed', phone: '01077766655' },
];

const PAYMENT_METHOD_SEEDS: PaymentMethodSeed[] = [
  { label: 'Vodafone Cash', details: '01098765432', presetKey: 'vodafone_cash', monthlyLimit: 20_000_000 },
  { label: 'InstaPay', details: 'ahmed.hassan@instapay', presetKey: 'instapay', monthlyLimit: 40_000_000 },
  { label: 'Fawry', details: 'Agent 778812', presetKey: 'fawry', isActive: false },
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
      { installmentSequence: 1, amount: 10_000, paidAtOffsetDays: -20, paymentMethodIndex: 0 },
      { installmentSequence: 2, amount: 6_000, paidAtOffsetDays: -13, paymentMethodIndex: 0 },
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
      { installmentSequence: 1, amount: 20_000, paidAtOffsetDays: -58, paymentMethodIndex: 1 },
      { installmentSequence: 2, amount: 20_000, paidAtOffsetDays: -28, paymentMethodIndex: 1 },
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

const PAYMENT_METHOD_TRANSACTION_SEEDS: PaymentMethodTransactionSeed[] = [
  {
    paymentMethodIndex: 0,
    direction: 'OUT',
    amount: 15_000_00,
    counterpartyName: 'Cairo Electronics Wholesale',
    counterpartyPhone: '01234567890',
    note: 'Restocking payment',
    occurredAtOffsetDays: -5,
  },
  {
    paymentMethodIndex: 1,
    direction: 'IN',
    amount: 5_000_00,
    counterpartyName: 'Mona Ibrahim',
    receiptUrl: 'https://picsum.photos/seed/pm-transaction-1/400/300',
    note: 'Manual transfer outside contract',
    occurredAtOffsetDays: -2,
  },
];

const PAYMENT_CLAIM_SEEDS: PaymentClaimSeed[] = [
  {
    contractIndex: 0,
    paymentMethodIndex: 1,
    amount: 6_000,
    screenshotUrl: 'https://picsum.photos/seed/payment-claim-pending/400/600',
    status: 'PENDING',
  },
  {
    contractIndex: 0,
    paymentMethodIndex: 0,
    amount: 6_000,
    screenshotUrl: 'https://picsum.photos/seed/payment-claim-declined/400/600',
    status: 'DECLINED',
    declineReason: "The screenshot doesn't match the claimed amount.",
    reviewedOffsetDays: -1,
  },
  {
    contractIndex: 2,
    paymentMethodIndex: 1,
    amount: 50_000,
    screenshotUrl: 'https://picsum.photos/seed/payment-claim-approved/400/600',
    status: 'APPROVED',
    reviewedOffsetDays: -3,
  },
];

interface SeededContract {
  contract: Contract;
  installments: Installment[];
}

async function seedContract(
  tenantId: string,
  customerId: string,
  contractSeed: ContractSeed,
  today: Date,
  paymentMethods: PaymentMethod[],
): Promise<SeededContract> {
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
    const paymentMethodId =
      paymentSeed.paymentMethodIndex !== undefined ? paymentMethods[paymentSeed.paymentMethodIndex].id : undefined;
    const payment = await prisma.payment.create({
      data: {
        tenantId,
        contractId: contract.id,
        paymentMethodId,
        amount: paymentSeed.amount,
        paidAt: addUtcDays(today, paymentSeed.paidAtOffsetDays),
      },
    });
    await prisma.paymentAllocation.create({
      data: { tenantId, paymentId: payment.id, installmentId: installment.id, amount: paymentSeed.amount },
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
    return { contract, installments };
  }

  const remainingCount = await prisma.installment.count({
    where: { contractId: contract.id, status: { in: ['PENDING', 'PARTIALLY_PAID'] } },
  });
  if (remainingCount === 0) {
    await prisma.contract.update({ where: { id: contract.id }, data: { status: 'COMPLETED' } });
  }

  return { contract, installments };
}

async function seed(): Promise<void> {
  const existingAdmin = await prisma.user.findUnique({ where: { email: SEED_ADMIN_EMAIL } });
  if (existingAdmin) {
    console.log(`Seed skipped: ${SEED_ADMIN_EMAIL} already exists.`);
    return;
  }

  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const tenant = await prisma.tenant.create({
    data: {
      name: SEED_TENANT_NAME,
      slug: slugify(SEED_TENANT_NAME),
      phone: '01001234567',
      about: 'We sell home appliances and furniture on flexible installment plans across Cairo and Alexandria.',
      brandColor: 'blue',
      notificationLanguage: 'AR',
      instagramUrl: 'https://instagram.com/demobusiness',
      facebookUrl: 'https://facebook.com/demobusiness',
      showInstallmentCalculator: true,
      calculatorPlans: [
        { months: 3, markupPercent: 0 },
        { months: 6, markupPercent: 5 },
        { months: 12, markupPercent: 10 },
      ],
      locations: [{ id: 'main-branch', name: 'Main Branch', address: '12 Nile St, Cairo', mapUrl: '' }],
    },
  });

  const [admin] = await Promise.all([
    prisma.user.create({ data: { tenantId: tenant.id, name: 'Admin', email: SEED_ADMIN_EMAIL, passwordHash, role: Role.ADMIN } }),
    prisma.user.create({ data: { tenantId: tenant.id, name: 'Staff', email: SEED_STAFF_EMAIL, passwordHash, role: Role.STAFF } }),
  ]);

  const today = toUtcMidnight(new Date());

  const customers = await Promise.all(
    CUSTOMER_SEEDS.map((customerSeed) => prisma.customer.create({ data: { tenantId: tenant.id, ...customerSeed } })),
  );

  const paymentMethods = await Promise.all(
    PAYMENT_METHOD_SEEDS.map((paymentMethodSeed, index) =>
      prisma.paymentMethod.create({
        data: {
          tenantId: tenant.id,
          label: paymentMethodSeed.label,
          details: paymentMethodSeed.details,
          presetKey: paymentMethodSeed.presetKey,
          monthlyLimit: paymentMethodSeed.monthlyLimit,
          isActive: paymentMethodSeed.isActive ?? true,
          sortOrder: index,
        },
      }),
    ),
  );

  const contracts: SeededContract[] = [];
  for (const contractSeed of CONTRACT_SEEDS) {
    contracts.push(
      await seedContract(tenant.id, customers[contractSeed.customerIndex].id, contractSeed, today, paymentMethods),
    );
  }

  for (const transactionSeed of PAYMENT_METHOD_TRANSACTION_SEEDS) {
    await prisma.paymentMethodTransaction.create({
      data: {
        tenantId: tenant.id,
        paymentMethodId: paymentMethods[transactionSeed.paymentMethodIndex].id,
        direction: transactionSeed.direction,
        amount: transactionSeed.amount,
        counterpartyName: transactionSeed.counterpartyName,
        counterpartyPhone: transactionSeed.counterpartyPhone,
        receiptUrl: transactionSeed.receiptUrl,
        note: transactionSeed.note,
        occurredAt: addUtcDays(today, transactionSeed.occurredAtOffsetDays),
      },
    });
  }

  for (const claimSeed of PAYMENT_CLAIM_SEEDS) {
    await prisma.paymentClaim.create({
      data: {
        tenantId: tenant.id,
        contractId: contracts[claimSeed.contractIndex].contract.id,
        paymentMethodId: paymentMethods[claimSeed.paymentMethodIndex].id,
        amount: claimSeed.amount,
        screenshotUrl: claimSeed.screenshotUrl,
        status: claimSeed.status,
        declineReason: claimSeed.declineReason,
        reviewedByUserId: claimSeed.status === 'PENDING' ? undefined : admin.id,
        reviewedAt: claimSeed.reviewedOffsetDays !== undefined ? addUtcDays(today, claimSeed.reviewedOffsetDays) : undefined,
      },
    });
  }

  console.log(`Seeded tenant "${tenant.name}" with admin ${SEED_ADMIN_EMAIL} / ${SEED_PASSWORD}`);
  console.log(`Seeded staff account ${SEED_STAFF_EMAIL} / ${SEED_PASSWORD}`);
  console.log(`Seeded ${customers.length} customers and ${CONTRACT_SEEDS.length} contracts.`);
  console.log(`Seeded ${paymentMethods.length} payment methods, ${PAYMENT_METHOD_TRANSACTION_SEEDS.length} transactions, ${PAYMENT_CLAIM_SEEDS.length} payment claims.`);
}

seed()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
