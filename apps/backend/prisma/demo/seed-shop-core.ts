import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { addUtcDays } from '../../src/common/date/utc-date';
import { egp } from './demo-amounts';
import { atTime, daysBefore } from './demo-dates';
import { DemoShopContext } from './demo-shop-context';
import { idCardImageUrl, logoImageUrl, portraitUrl } from './demo-images';
import { createPhoneGenerator } from './demo-phone';
import { RandomSource } from './random';

const TENANT_AGE_IN_DAYS = 470;
const TRIAL_DAYS = 14;
const PAID_MONTH_COUNT = 14;
const DAYS_PER_SUBSCRIPTION_PERIOD = 30;
const DAYS_LEFT_ON_CURRENT_PERIOD = 22;
const LEGACY_MONTHLY_PRICE = egp(500);
const CURRENT_MONTHLY_PRICE = egp(200);
const CURRENT_PRICE_PERIOD_COUNT = 4;
const CALCULATOR_PLANS = [
  { months: 3, markupPercent: 0 },
  { months: 6, markupPercent: 5 },
  { months: 12, markupPercent: 10 },
];
const PORTRAIT_SHARE_OUT_OF_TEN = 7;
const ID_IMAGES_SHARE_OUT_OF_TEN = 4;

export interface DemoShopIdentity {
  tenantId: string;
  tenantCreatedAt: Date;
  staffIds: string[];
  customerIds: string[];
  walletIds: string[];
  activeWalletIds: string[];
}

export function buildDemoShopIdentity(
  staffCount: number,
  customerCount: number,
  wallets: { isActive: boolean }[],
  today: Date,
): DemoShopIdentity {
  const walletIds = wallets.map(() => randomUUID());
  return {
    tenantId: randomUUID(),
    tenantCreatedAt: daysBefore(today, TENANT_AGE_IN_DAYS),
    staffIds: Array.from({ length: staffCount }, () => randomUUID()),
    customerIds: Array.from({ length: customerCount }, () => randomUUID()),
    walletIds,
    activeWalletIds: walletIds.filter((_, index) => wallets[index].isActive),
  };
}

function buildSubscriptionRows(context: DemoShopContext): Prisma.TenantSubscriptionCreateManyInput[] {
  const currentPeriodEnd = addUtcDays(context.today, DAYS_LEFT_ON_CURRENT_PERIOD);
  return Array.from({ length: PAID_MONTH_COUNT }, (_, index) => {
    const periodsFromEnd = PAID_MONTH_COUNT - 1 - index;
    const periodEnd = addUtcDays(currentPeriodEnd, -periodsFromEnd * DAYS_PER_SUBSCRIPTION_PERIOD);
    const periodStart = addUtcDays(periodEnd, -DAYS_PER_SUBSCRIPTION_PERIOD);
    return {
      tenantId: context.tenantId,
      periodStart,
      periodEnd,
      amount: periodsFromEnd < CURRENT_PRICE_PERIOD_COUNT ? CURRENT_MONTHLY_PRICE : LEGACY_MONTHLY_PRICE,
      createdAt: atTime(periodStart, 10, 5),
    };
  });
}

export async function createDemoTenant(context: DemoShopContext, subscriptionExpiresOn: Date): Promise<void> {
  const { profile, tenantId, tenantCreatedAt } = context;
  await context.transaction.tenant.create({
    data: {
      id: tenantId,
      name: profile.tenant.name,
      displayName: profile.tenant.name,
      slug: profile.tenant.slug,
      logoUrl: logoImageUrl(profile.tenant.logoInitials, profile.tenant.brandColor),
      brandColor: profile.tenant.brandColor,
      phone: profile.tenant.phone,
      about: profile.tenant.about,
      instagramUrl: profile.tenant.instagramUrl,
      facebookUrl: profile.tenant.facebookUrl,
      tiktokUrl: profile.tenant.tiktokUrl,
      showInstallmentCalculator: true,
      calculatorPlans: CALCULATOR_PLANS,
      locations: profile.tenant.locations.map((location) => ({ id: randomUUID(), mapUrl: '', ...location })),
      notificationLanguage: profile.language,
      isDemo: true,
      subscriptionExpiresOn,
      createdAt: tenantCreatedAt,
      reminderMessageSettings: { create: {} },
    },
    select: { id: true },
  });
  await context.transaction.tenantSubscription.createMany({ data: buildSubscriptionRows(context) });
}

export function resolveSubscriptionExpiry(today: Date): Date {
  return addUtcDays(today, DAYS_LEFT_ON_CURRENT_PERIOD);
}

export async function createDemoStaff(context: DemoShopContext, passwordHash: string): Promise<void> {
  const { profile, tenantId, staffIds, tenantCreatedAt, random } = context;
  await context.transaction.user.createMany({
    data: profile.staff.map((member, index) => ({
      id: staffIds[index],
      tenantId,
      name: member.name,
      email: member.email,
      passwordHash,
      role: member.role,
      isActive: member.isActive,
      createdAt: atTime(addUtcDays(tenantCreatedAt, index === 0 ? 0 : random.integer(20, 160)), 9, 30),
    })),
  });
}

function resolveFirstSaleDates(context: DemoShopContext): Map<string, Date> {
  const firstSaleByCustomerId = new Map<string, Date>();
  for (const contract of context.history.contracts) {
    const saleDate = contract.startDate as Date;
    const current = firstSaleByCustomerId.get(contract.customerId);
    if (!current || saleDate.getTime() < current.getTime()) {
      firstSaleByCustomerId.set(contract.customerId, saleDate);
    }
  }
  return firstSaleByCustomerId;
}

function buildCustomerRow(
  context: DemoShopContext,
  index: number,
  firstSaleDates: Map<string, Date>,
  generatePhone: () => string,
  random: RandomSource,
): Prisma.CustomerCreateManyInput {
  const customer = context.profile.customers[index];
  const customerId = context.customerIds[index];
  const firstSaleDate = firstSaleDates.get(customerId) ?? daysBefore(context.today, random.integer(5, 60));
  const createdAt = atTime(daysBefore(firstSaleDate, random.integer(0, 3)), 12, 15);
  const hasIdImages = index % 10 < ID_IMAGES_SHARE_OUT_OF_TEN;
  return {
    id: customerId,
    tenantId: context.tenantId,
    name: customer.name,
    phone: generatePhone(),
    address: customer.address,
    notes: customer.notes,
    photoUrl: index % 10 < PORTRAIT_SHARE_OUT_OF_TEN ? portraitUrl(customer.gender, index) : undefined,
    idImageFrontUrl: hasIdImages ? idCardImageUrl('Front') : undefined,
    idImageBackUrl: hasIdImages ? idCardImageUrl('Back') : undefined,
    notificationLanguage: context.profile.language,
    createdAt,
    updatedAt: createdAt,
  };
}

export async function createDemoCustomers(context: DemoShopContext): Promise<void> {
  const generatePhone = createPhoneGenerator(context.random);
  const firstSaleDates = resolveFirstSaleDates(context);
  await context.transaction.customer.createMany({
    data: context.profile.customers.map((_, index) =>
      buildCustomerRow(context, index, firstSaleDates, generatePhone, context.random),
    ),
  });
}

export async function createDemoWallets(context: DemoShopContext): Promise<void> {
  await context.transaction.paymentMethod.createMany({
    data: context.profile.wallets.map((wallet, index) => ({
      id: context.walletIds[index],
      tenantId: context.tenantId,
      label: wallet.label,
      details: wallet.details,
      presetKey: wallet.presetKey,
      iconKey: wallet.iconKey,
      monthlyLimit: wallet.monthlyLimitInPounds ? egp(wallet.monthlyLimitInPounds) : undefined,
      isActive: wallet.isActive,
      sortOrder: index,
      createdAt: atTime(addUtcDays(context.tenantCreatedAt, 3 + index), 10, 0),
    })),
  });
}

export async function createDemoHistory(context: DemoShopContext): Promise<void> {
  const { transaction, history } = context;
  await transaction.contract.createMany({ data: history.contracts });
  await transaction.installment.createMany({ data: history.installments });
  await transaction.payment.createMany({ data: history.payments });
  await transaction.paymentAllocation.createMany({ data: history.allocations });
}
