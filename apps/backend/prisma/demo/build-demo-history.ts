import { randomUUID } from 'node:crypto';
import {
  CalculationMethod,
  ContractStatus,
  InstallmentStatus,
  Prisma,
  RecurrenceType,
} from '@prisma/client';
import { addUtcDays, addUtcMonthsClamped } from '../../src/common/date/utc-date';
import { generateDueDates } from '../../src/modules/contracts/installments/recurrence';
import { calculateInstallmentSchedule } from '../../src/modules/contracts/installments/schedule';
import { egp, roundToStep } from './demo-amounts';
import { atTime, daysBefore } from './demo-dates';
import { productImageUrl } from './demo-images';
import { DemoProduct, DemoShopProfile } from './demo-types';
import { RandomSource } from './random';

const SALE_AGES_IN_MONTHS = [14, 13, 13, 12, 11, 10, 10, 9, 8, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 2, 2, 1, 1, 0, 0, 0];
const CANCELLED_PLAN_INDEXES = new Set([8, 13]);
const STOPPED_PLAN_INDEXES = new Set([5, 9, 11, 16]);
const LATE_PLAN_INDEXES = new Set([2, 6, 7, 10, 22]);
const WEEKLY_PLAN_INDEXES = new Set([22, 23]);
const BIWEEKLY_PLAN_INDEXES = new Set([6, 24]);
const DUE_OFFSET_BY_ANCHORED_PLAN_INDEX = new Map([
  [12, 0],
  [14, 1],
  [15, 2],
  [17, 0],
  [18, 3],
  [19, 5],
  [20, 6],
  [21, 0],
]);
const MONTHLY_INSTALLMENT_COUNTS = [3, 6, 6, 9, 10, 12];
const WEEKLY_INSTALLMENT_COUNTS = [8, 10, 12];
const MINIMUM_COMPLETABLE_COUNT = 3;
const DOWN_PAYMENT_SHARES = [0.1, 0.15, 0.2, 0.25, 0.3];
const MARKUP_PERCENTS = [5, 8, 10, 12, 15];
const PAYMENTS_BEFORE_CANCELLATION = 2;
const MINIMUM_PARTIAL_PAYMENT = egp(50);

type PaymentBehavior = 'GOOD' | 'LATE' | 'STOPPED';
type PaymentOutcome = 'ON_TIME' | 'LATE' | 'PARTIAL';

interface ContractPlan {
  index: number;
  customerIndex: number;
  product: DemoProduct;
  saleDate: Date;
  firstPaymentDate: Date;
  recurrenceType: RecurrenceType;
  calculationMethod: CalculationMethod;
  markupPercent?: number;
  installmentCount?: number;
  fixedInstallmentAmount?: number;
  downPayment: number;
  behavior: PaymentBehavior;
  stopAfter: number;
  isCancelled: boolean;
}

interface Settlement {
  amount: number;
  paidAt: Date;
}

export interface DemoHistoryInput {
  profile: DemoShopProfile;
  today: Date;
  random: RandomSource;
  tenantId: string;
  customerIds: string[];
  walletChoices: (string | null)[];
}

type WithId<Input> = Input & { id: string };

export interface DemoHistory {
  contracts: WithId<Prisma.ContractCreateManyInput>[];
  installments: WithId<Prisma.InstallmentCreateManyInput>[];
  payments: WithId<Prisma.PaymentCreateManyInput>[];
  allocations: Prisma.PaymentAllocationCreateManyInput[];
}

function resolveBehavior(index: number): PaymentBehavior {
  if (STOPPED_PLAN_INDEXES.has(index)) {
    return 'STOPPED';
  }
  return LATE_PLAN_INDEXES.has(index) ? 'LATE' : 'GOOD';
}

function resolveRecurrence(index: number): RecurrenceType {
  if (WEEKLY_PLAN_INDEXES.has(index)) {
    return RecurrenceType.WEEKLY;
  }
  return BIWEEKLY_PLAN_INDEXES.has(index) ? RecurrenceType.BIWEEKLY : RecurrenceType.MONTHLY;
}

function resolveFirstPaymentDate(saleDate: Date, recurrenceType: RecurrenceType): Date {
  switch (recurrenceType) {
    case RecurrenceType.WEEKLY:
      return addUtcDays(saleDate, 7);
    case RecurrenceType.BIWEEKLY:
      return addUtcDays(saleDate, 14);
    default:
      return addUtcMonthsClamped(saleDate, 1);
  }
}

function resolveSaleDate(index: number, monthsAgo: number, today: Date, random: RandomSource): Date {
  const dueOffset = DUE_OFFSET_BY_ANCHORED_PLAN_INDEX.get(index);
  if (dueOffset !== undefined) {
    return addUtcMonthsClamped(addUtcDays(today, dueOffset), -monthsAgo);
  }
  const ageInDays = monthsAgo === 0 ? random.integer(1, 8) : monthsAgo * 30 + random.integer(0, 14);
  return daysBefore(today, ageInDays);
}

function resolveInstallmentCount(
  index: number,
  recurrenceType: RecurrenceType,
  monthsAgo: number,
  behavior: PaymentBehavior,
  random: RandomSource,
): number {
  if (recurrenceType !== RecurrenceType.MONTHLY) {
    return random.pick(WEEKLY_INSTALLMENT_COUNTS);
  }
  if (DUE_OFFSET_BY_ANCHORED_PLAN_INDEX.has(index)) {
    return Math.max(random.pick(MONTHLY_INSTALLMENT_COUNTS), monthsAgo + 3);
  }
  if (behavior === 'GOOD' && random.chance(0.7)) {
    const completableCounts = MONTHLY_INSTALLMENT_COUNTS.filter(
      (count) => count <= Math.max(monthsAgo, MINIMUM_COMPLETABLE_COUNT),
    );
    return random.pick(completableCounts);
  }
  return random.pick(MONTHLY_INSTALLMENT_COUNTS);
}

function buildContractPlan(index: number, profile: DemoShopProfile, today: Date, random: RandomSource): ContractPlan {
  const monthsAgo = SALE_AGES_IN_MONTHS[index % SALE_AGES_IN_MONTHS.length];
  const product = profile.products[(index * 5 + 3) % profile.products.length];
  const recurrenceType = resolveRecurrence(index);
  const behavior = resolveBehavior(index);
  const installmentCount = resolveInstallmentCount(index, recurrenceType, monthsAgo, behavior, random);
  const price = egp(product.priceInPounds);
  const downPayment = random.chance(0.1) ? 0 : roundToStep(price * random.pick(DOWN_PAYMENT_SHARES));
  const saleDate = resolveSaleDate(index, monthsAgo, today, random);
  const usesFixedAmount = index % 7 === 3;
  const usesMarkup = !usesFixedAmount && index % 2 === 0;

  return {
    index,
    customerIndex: index % profile.customers.length,
    product,
    saleDate,
    firstPaymentDate: resolveFirstPaymentDate(saleDate, recurrenceType),
    recurrenceType,
    calculationMethod: usesFixedAmount
      ? CalculationMethod.FIXED_AMOUNT
      : usesMarkup
        ? CalculationMethod.MARKUP_PERCENT
        : CalculationMethod.FIXED_COUNT,
    markupPercent: usesMarkup ? random.pick(MARKUP_PERCENTS) : undefined,
    installmentCount: usesFixedAmount ? undefined : installmentCount,
    fixedInstallmentAmount: usesFixedAmount
      ? Math.max(roundToStep((price - downPayment) / installmentCount), MINIMUM_PARTIAL_PAYMENT)
      : undefined,
    downPayment,
    behavior,
    stopAfter: random.integer(1, Math.max(1, installmentCount - 3)),
    isCancelled: CANCELLED_PLAN_INDEXES.has(index),
  };
}

function pickOutcome(behavior: PaymentBehavior, random: RandomSource): PaymentOutcome {
  if (behavior !== 'LATE') {
    return random.chance(0.92) ? 'ON_TIME' : 'LATE';
  }
  const roll = random.integer(1, 100);
  if (roll <= 50) {
    return 'ON_TIME';
  }
  return roll <= 88 ? 'LATE' : 'PARTIAL';
}

function resolveDaysAfterDue(outcome: PaymentOutcome, random: RandomSource): number {
  switch (outcome) {
    case 'ON_TIME':
      return random.integer(-3, 1);
    case 'LATE':
      return random.integer(4, 24);
    case 'PARTIAL':
      return random.integer(0, 4);
  }
}

function resolvePaidAmount(outcome: PaymentOutcome, installmentAmount: number, random: RandomSource): number {
  if (outcome !== 'PARTIAL' || installmentAmount <= MINIMUM_PARTIAL_PAYMENT * 2) {
    return installmentAmount;
  }
  const partialShare = random.integer(40, 70) / 100;
  const partialAmount = roundToStep(installmentAmount * partialShare);
  return Math.min(Math.max(partialAmount, MINIMUM_PARTIAL_PAYMENT), installmentAmount - MINIMUM_PARTIAL_PAYMENT);
}

function settleInstallment(
  plan: ContractPlan,
  installmentAmount: number,
  dueDate: Date,
  installmentIndex: number,
  today: Date,
  random: RandomSource,
): Settlement | null {
  if (plan.isCancelled && installmentIndex >= PAYMENTS_BEFORE_CANCELLATION) {
    return null;
  }
  if (plan.behavior === 'STOPPED' && installmentIndex >= plan.stopAfter) {
    return null;
  }
  const outcome = pickOutcome(plan.behavior, random);
  const paidDate = addUtcDays(dueDate, resolveDaysAfterDue(outcome, random));
  if (paidDate.getTime() > today.getTime() || paidDate.getTime() <= plan.saleDate.getTime()) {
    return null;
  }
  return {
    amount: resolvePaidAmount(outcome, installmentAmount, random),
    paidAt: atTime(paidDate, random.integer(9, 21), random.integer(0, 59)),
  };
}

function resolveInstallmentStatus(amount: number, paidAmount: number, isCancelled: boolean): InstallmentStatus {
  if (paidAmount >= amount) {
    return InstallmentStatus.PAID;
  }
  if (paidAmount > 0) {
    return isCancelled ? InstallmentStatus.CANCELLED : InstallmentStatus.PARTIALLY_PAID;
  }
  return isCancelled ? InstallmentStatus.CANCELLED : InstallmentStatus.PENDING;
}

function resolveContractStatus(plan: ContractPlan, installmentStatuses: InstallmentStatus[]): ContractStatus {
  if (plan.isCancelled) {
    return ContractStatus.CANCELLED;
  }
  const isFullyPaid = installmentStatuses.every((status) => status === InstallmentStatus.PAID);
  return isFullyPaid ? ContractStatus.COMPLETED : ContractStatus.ACTIVE;
}

function buildPlanRecords(plan: ContractPlan, input: DemoHistoryInput): DemoHistory {
  const { tenantId, today, random, customerIds, walletChoices } = input;
  const schedule = calculateInstallmentSchedule({
    calculationMethod: plan.calculationMethod,
    productPrice: egp(plan.product.priceInPounds),
    downPayment: plan.downPayment,
    markupPercent: plan.markupPercent,
    installmentCount: plan.installmentCount,
    fixedInstallmentAmount: plan.fixedInstallmentAmount,
  });
  const dueDates = generateDueDates({
    firstPaymentDate: plan.firstPaymentDate,
    recurrenceType: plan.recurrenceType,
    installmentCount: schedule.installmentAmounts.length,
  });
  const contractId = randomUUID();
  const installments: DemoHistory['installments'] = [];
  const payments: DemoHistory['payments'] = [];
  const allocations: Prisma.PaymentAllocationCreateManyInput[] = [];

  schedule.installmentAmounts.forEach((amount, installmentIndex) => {
    const installmentId = randomUUID();
    const settlement = settleInstallment(plan, amount, dueDates[installmentIndex], installmentIndex, today, random);
    if (settlement) {
      const paymentId = randomUUID();
      payments.push({
        id: paymentId,
        tenantId,
        contractId,
        paymentMethodId: random.pick(walletChoices),
        amount: settlement.amount,
        paidAt: settlement.paidAt,
        createdAt: settlement.paidAt,
      });
      allocations.push({ tenantId, paymentId, installmentId, amount: settlement.amount });
    }
    const paidAmount = settlement?.amount ?? 0;
    installments.push({
      id: installmentId,
      tenantId,
      contractId,
      sequence: installmentIndex + 1,
      dueDate: dueDates[installmentIndex],
      amount,
      paidAmount,
      status: resolveInstallmentStatus(amount, paidAmount, plan.isCancelled),
    });
  });

  return {
    contracts: [
      {
        id: contractId,
        tenantId,
        customerId: customerIds[plan.customerIndex],
        productName: plan.product.name,
        productPrice: egp(plan.product.priceInPounds),
        costPrice: egp(plan.product.costInPounds),
        downPayment: plan.downPayment,
        totalAmount: schedule.totalAmount,
        calculationMethod: plan.calculationMethod,
        markupPercent: plan.markupPercent,
        installmentCount: schedule.installmentAmounts.length,
        recurrenceType: plan.recurrenceType,
        startDate: plan.saleDate,
        firstPaymentDate: plan.firstPaymentDate,
        status: resolveContractStatus(
          plan,
          installments.map((installment) => installment.status as InstallmentStatus),
        ),
        tag: plan.product.tag,
        imageUrl: productImageUrl(plan.product.imageLabel, input.profile.tenant.brandColor),
        createdAt: atTime(plan.saleDate, 11, 10 + plan.index),
      },
    ],
    installments,
    payments,
    allocations,
  };
}

export function buildDemoHistory(input: DemoHistoryInput): DemoHistory {
  const contractCount = SALE_AGES_IN_MONTHS.length;
  const records = Array.from({ length: contractCount }, (_, index) =>
    buildPlanRecords(buildContractPlan(index, input.profile, input.today, input.random), input),
  );
  return {
    contracts: records.flatMap((record) => record.contracts),
    installments: records.flatMap((record) => record.installments),
    payments: records.flatMap((record) => record.payments),
    allocations: records.flatMap((record) => record.allocations),
  };
}
