import { Prisma, PrismaClient } from '@prisma/client';
import { buildDemoHistory } from './build-demo-history';
import { DemoShopContext } from './demo-shop-context';
import { DemoShopProfile } from './demo-types';
import { createRandomSource } from './random';
import {
  createDemoBroadcasts,
  createDemoAuditLogs,
  createDemoNotificationLogs,
  createDemoOffers,
  createDemoPaymentClaims,
  createDemoSuppliers,
  createDemoSupportMessages,
} from './seed-shop-activity';
import {
  buildDemoShopIdentity,
  createDemoCustomers,
  createDemoHistory,
  createDemoStaff,
  createDemoTenant,
  createDemoWallets,
  resolveSubscriptionExpiry,
} from './seed-shop-core';

const TRANSACTION_TIMEOUT_IN_MILLISECONDS = 180_000;
const TRANSACTION_MAX_WAIT_IN_MILLISECONDS = 30_000;
const CASH_PAYMENT_WEIGHT = 2;

export interface DemoShopSummary {
  shopName: string;
  slug: string;
  staffEmails: string[];
  customerCount: number;
  contractCount: number;
  paymentCount: number;
}

function buildContext(
  transaction: Prisma.TransactionClient,
  profile: DemoShopProfile,
  today: Date,
): DemoShopContext {
  const random = createRandomSource(profile.seed);
  const identity = buildDemoShopIdentity(profile.staff.length, profile.customers.length, profile.wallets, today);
  const walletChoices = [
    ...identity.activeWalletIds,
    ...Array.from({ length: CASH_PAYMENT_WEIGHT }, () => null),
  ];
  const history = buildDemoHistory({
    profile,
    today,
    random,
    tenantId: identity.tenantId,
    customerIds: identity.customerIds,
    walletChoices,
  });
  return { transaction, profile, today, random, history, ...identity };
}

async function writeDemoShop(context: DemoShopContext, passwordHash: string): Promise<void> {
  await createDemoTenant(context, resolveSubscriptionExpiry(context.today));
  await createDemoStaff(context, passwordHash);
  await createDemoWallets(context);
  await createDemoCustomers(context);
  await createDemoHistory(context);
  const supplierIds = await createDemoSuppliers(context);
  await createDemoOffers(context);
  await createDemoPaymentClaims(context);
  await createDemoSupportMessages(context);
  await createDemoBroadcasts(context);
  await createDemoNotificationLogs(context);
  await createDemoAuditLogs(context, supplierIds);
}

export async function seedDemoShop(
  prisma: PrismaClient,
  profile: DemoShopProfile,
  today: Date,
  passwordHash: string,
): Promise<DemoShopSummary | null> {
  const existingShop = await prisma.tenant.findUnique({ where: { slug: profile.tenant.slug }, select: { id: true } });
  if (existingShop) {
    return null;
  }
  const existingStaff = await prisma.user.findFirst({
    where: { email: { in: profile.staff.map((member) => member.email) } },
    select: { id: true },
  });
  if (existingStaff) {
    throw new Error(`A user from "${profile.tenant.name}" already exists under another shop.`);
  }

  let summary: DemoShopSummary | null = null;
  await prisma.$transaction(
    async (transaction) => {
      const context = buildContext(transaction, profile, today);
      await writeDemoShop(context, passwordHash);
      summary = {
        shopName: profile.tenant.name,
        slug: profile.tenant.slug,
        staffEmails: profile.staff.map((member) => member.email),
        customerCount: profile.customers.length,
        contractCount: context.history.contracts.length,
        paymentCount: context.history.payments.length,
      };
    },
    { timeout: TRANSACTION_TIMEOUT_IN_MILLISECONDS, maxWait: TRANSACTION_MAX_WAIT_IN_MILLISECONDS },
  );
  return summary;
}
