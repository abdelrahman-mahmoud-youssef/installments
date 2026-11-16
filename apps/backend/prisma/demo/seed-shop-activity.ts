import { randomUUID } from 'node:crypto';
import {
  BroadcastAudience,
  BroadcastRecipientStatus,
  BroadcastStatus,
  ContractStatus,
  InstallmentStatus,
  PaymentClaimStatus,
  Prisma,
  ReminderChannel,
} from '@prisma/client';
import { DemoHistory } from './build-demo-history';
import { egp } from './demo-amounts';
import { atTime, daysBefore } from './demo-dates';
import { DemoShopContext } from './demo-shop-context';
import { promotionImageUrl, receiptImageUrl, transferScreenshotUrl } from './demo-images';
import { createPhoneGenerator } from './demo-phone';

const FAILED_RECIPIENT_EVERY = 9;
const REMINDER_LOG_DAYS_AGO = [1, 8, 15];
const FAILED_REMINDER_CHANCE = 0.2;
const REPLY_SEEN_AFTER_DAYS = 5;
const ROTATING_STAFF_COUNT = 4;
const INACTIVE_OFFER_INDEX = 2;

type InstallmentRow = DemoHistory['installments'][number];

function remainingOf(installment: InstallmentRow): number {
  return installment.amount - (installment.paidAmount ?? 0);
}

export async function createDemoSuppliers(context: DemoShopContext): Promise<string[]> {
  const { profile, tenantId, random, today, walletIds } = context;
  const generatePhone = createPhoneGenerator(random);
  const supplierIds = profile.suppliers.map(() => randomUUID());
  await context.transaction.counterparty.createMany({
    data: profile.suppliers.map((supplier, index) => ({
      id: supplierIds[index],
      tenantId,
      name: supplier.name,
      phone: supplier.phone,
      notes: supplier.notes,
      createdAt: atTime(daysBefore(today, 400 - index * 12), 11, 0),
    })),
  });
  await context.transaction.paymentMethodTransaction.createMany({
    data: profile.transactions.map((transaction) => {
      const supplier =
        transaction.supplierIndex !== undefined ? profile.suppliers[transaction.supplierIndex] : undefined;
      const occurredAt = atTime(daysBefore(today, transaction.daysAgo), random.integer(10, 19), random.integer(0, 59));
      return {
        tenantId,
        paymentMethodId: walletIds[transaction.walletIndex],
        counterpartyId: transaction.supplierIndex !== undefined ? supplierIds[transaction.supplierIndex] : undefined,
        direction: transaction.direction,
        amount: egp(transaction.amountInPounds),
        counterpartyName: supplier?.name ?? transaction.counterpartyName,
        counterpartyPhone: supplier?.phone ?? (transaction.counterpartyName ? generatePhone() : undefined),
        receiptUrl: transaction.direction === 'IN' ? receiptImageUrl('Transfer receipt') : undefined,
        note: transaction.note,
        occurredAt,
        createdAt: occurredAt,
      };
    }),
  });
  await context.transaction.counterpartyAdjustment.createMany({
    data: profile.adjustments.map((adjustment) => {
      const occurredAt = atTime(daysBefore(today, adjustment.daysAgo), 15, 0);
      return {
        tenantId,
        counterpartyId: supplierIds[adjustment.supplierIndex],
        direction: adjustment.direction,
        amount: egp(adjustment.amountInPounds),
        note: adjustment.note,
        occurredAt,
        createdAt: occurredAt,
      };
    }),
  });
  return supplierIds;
}

export async function createDemoOffers(context: DemoShopContext): Promise<void> {
  const { profile, tenantId, today } = context;
  await context.transaction.offer.createMany({
    data: profile.offers.map((offer, index) => {
      const createdAt = atTime(daysBefore(today, offer.daysAgo), 10, 0);
      return {
        tenantId,
        title: offer.title,
        description: offer.description,
        tag: offer.tag,
        images: offer.imageLabels.map((label) => promotionImageUrl(label, profile.tenant.brandColor)),
        isActive: index !== INACTIVE_OFFER_INDEX,
        sortOrder: index,
        createdAt,
        updatedAt: createdAt,
      };
    }),
  });
}

function findClaimableInstallments(context: DemoShopContext): {
  outstanding: InstallmentRow[];
  paid: InstallmentRow[];
} {
  const activeContractIds = new Set(
    context.history.contracts.filter((contract) => contract.status === ContractStatus.ACTIVE).map((contract) => contract.id),
  );
  const byDueDate = (first: InstallmentRow, second: InstallmentRow) =>
    new Date(first.dueDate).getTime() - new Date(second.dueDate).getTime();
  const outstanding = context.history.installments
    .filter(
      (installment) =>
        activeContractIds.has(installment.contractId) &&
        (installment.status === InstallmentStatus.PENDING || installment.status === InstallmentStatus.PARTIALLY_PAID),
    )
    .sort(byDueDate);
  const paid = context.history.installments
    .filter((installment) => installment.status === InstallmentStatus.PAID)
    .sort(byDueDate)
    .reverse();
  return { outstanding, paid };
}

function pickFromDistinctContracts(installments: InstallmentRow[], count: number): InstallmentRow[] {
  const seenContractIds = new Set<string>();
  const picked: InstallmentRow[] = [];
  for (const installment of installments) {
    if (picked.length === count) {
      break;
    }
    if (!seenContractIds.has(installment.contractId)) {
      seenContractIds.add(installment.contractId);
      picked.push(installment);
    }
  }
  return picked;
}

export async function createDemoPaymentClaims(context: DemoShopContext): Promise<void> {
  const { tenantId, today, random, profile } = context;
  const reviewerId = context.staffIds[0];
  const { outstanding, paid } = findClaimableInstallments(context);
  const [firstPending, secondPending, declined] = pickFromDistinctContracts(outstanding, 3);
  const approved = paid[0];
  const walletLabelAt = (walletId: string) => profile.wallets[context.walletIds.indexOf(walletId)].label;
  const buildClaim = (
    installment: InstallmentRow,
    status: PaymentClaimStatus,
    createdAt: Date,
    reviewedAt?: Date,
    declineReason?: string,
  ): Prisma.PaymentClaimCreateManyInput => {
    const walletId = random.pick(context.activeWalletIds);
    return {
      tenantId,
      contractId: installment.contractId,
      installmentId: installment.id,
      paymentMethodId: walletId,
      amount: remainingOf(installment) > 0 ? remainingOf(installment) : installment.amount,
      screenshotUrl: transferScreenshotUrl(walletLabelAt(walletId)),
      status,
      declineReason,
      reviewedByUserId: reviewedAt ? reviewerId : undefined,
      reviewedAt,
      createdAt,
    };
  };

  const claims: Prisma.PaymentClaimCreateManyInput[] = [];
  if (firstPending) {
    claims.push(buildClaim(firstPending, PaymentClaimStatus.PENDING, atTime(daysBefore(today, 1), 18, 40)));
  }
  if (secondPending) {
    claims.push(buildClaim(secondPending, PaymentClaimStatus.PENDING, atTime(daysBefore(today, 0), 9, 15)));
  }
  if (declined) {
    claims.push(
      buildClaim(
        declined,
        PaymentClaimStatus.DECLINED,
        atTime(daysBefore(today, 6), 14, 5),
        atTime(daysBefore(today, 5), 10, 20),
        profile.declineReason,
      ),
    );
  }
  if (approved) {
    claims.push(
      buildClaim(
        approved,
        PaymentClaimStatus.APPROVED,
        atTime(daysBefore(today, 20), 17, 30),
        atTime(daysBefore(today, 19), 9, 45),
      ),
    );
  }
  await context.transaction.paymentClaim.createMany({ data: claims });
}

export async function createDemoSupportMessages(context: DemoShopContext): Promise<void> {
  const { profile, tenantId, today } = context;
  const sender = profile.staff[0];
  await context.transaction.supportMessage.createMany({
    data: profile.supportThreads.map((thread) => {
      const createdAt = atTime(daysBefore(today, thread.daysAgo), 13, 25);
      const repliedAt = thread.reply ? atTime(daysBefore(today, thread.daysAgo - 1), 11, 5) : undefined;
      return {
        tenantId,
        userId: context.staffIds[0],
        userName: sender.name,
        userEmail: sender.email,
        subject: thread.subject,
        message: thread.message,
        adminReply: thread.reply,
        repliedAt,
        seenAt: repliedAt && thread.daysAgo > REPLY_SEEN_AFTER_DAYS ? atTime(repliedAt, 1, 0) : undefined,
        createdAt,
      };
    }),
  });
}

export async function createDemoBroadcasts(context: DemoShopContext): Promise<void> {
  const { profile, tenantId, today, customerIds } = context;
  for (const announcement of profile.announcements) {
    const createdAt = atTime(daysBefore(today, announcement.daysAgo), 12, 0);
    const broadcastId = randomUUID();
    await context.transaction.broadcast.create({
      data: {
        id: broadcastId,
        tenantId,
        body: announcement.body,
        audience: BroadcastAudience.ALL,
        status: BroadcastStatus.DONE,
        createdAt,
      },
      select: { id: true },
    });
    await context.transaction.broadcastRecipient.createMany({
      data: customerIds.map((customerId, index) => {
        const hasFailed = index % FAILED_RECIPIENT_EVERY === FAILED_RECIPIENT_EVERY - 1;
        return {
          tenantId,
          broadcastId,
          customerId,
          status: hasFailed ? BroadcastRecipientStatus.FAILED : BroadcastRecipientStatus.SENT,
          sentAt: atTime(createdAt, 0, 2 + index),
          error: hasFailed ? profile.failedReminderError : undefined,
        };
      }),
    });
  }
}

export async function createDemoNotificationLogs(context: DemoShopContext): Promise<void> {
  const { tenantId, today, random, profile } = context;
  const overdueContractIds = new Set(
    context.history.installments
      .filter(
        (installment) =>
          new Date(installment.dueDate).getTime() < today.getTime() &&
          (installment.status === InstallmentStatus.PENDING || installment.status === InstallmentStatus.PARTIALLY_PAID),
      )
      .map((installment) => installment.contractId),
  );
  const overdueCustomerIds = new Set(
    context.history.contracts.filter((contract) => overdueContractIds.has(contract.id)).map((contract) => contract.customerId),
  );
  const logs: Prisma.CustomerNotificationLogCreateManyInput[] = [];
  for (const customerId of overdueCustomerIds) {
    for (const daysAgo of REMINDER_LOG_DAYS_AGO) {
      const hasFailed = random.chance(FAILED_REMINDER_CHANCE);
      logs.push({
        tenantId,
        customerId,
        channel: ReminderChannel.WHATSAPP,
        success: !hasFailed,
        error: hasFailed ? profile.failedReminderError : undefined,
        sentAt: atTime(daysBefore(today, daysAgo), 8, random.integer(0, 20)),
      });
    }
  }
  await context.transaction.customerNotificationLog.createMany({ data: logs });
}

export async function createDemoAuditLogs(context: DemoShopContext, supplierIds: string[]): Promise<void> {
  const { profile, tenantId, today, history } = context;
  const actors = profile.staff.slice(0, ROTATING_STAFF_COUNT);
  const actorAt = (position: number) => {
    const index = position % actors.length;
    return { userId: context.staffIds[index], userName: actors[index].name, userEmail: actors[index].email };
  };
  const knownCustomerIds = new Set<string>();
  const logs: Prisma.AuditLogCreateManyInput[] = [];

  history.contracts.forEach((contract, position) => {
    const createdAt = contract.createdAt as Date;
    if (!knownCustomerIds.has(contract.customerId)) {
      knownCustomerIds.add(contract.customerId);
      logs.push({
        tenantId,
        ...actorAt(position),
        action: 'customer.create',
        entityType: 'Customer',
        entityId: contract.customerId,
        createdAt: atTime(createdAt, 0, -6),
      });
    }
    logs.push({
      tenantId,
      ...actorAt(position),
      action: 'contract.create',
      entityType: 'Contract',
      entityId: contract.id,
      metadata: { productName: contract.productName },
      createdAt,
    });
  });

  history.payments.forEach((payment, position) => {
    logs.push({
      tenantId,
      ...actorAt(position + 1),
      action: 'payment.create',
      entityType: 'Payment',
      entityId: payment.id,
      metadata: { amount: payment.amount },
      createdAt: payment.paidAt as Date,
    });
  });

  supplierIds.forEach((supplierId, position) => {
    logs.push({
      tenantId,
      ...actorAt(0),
      action: 'counterparty.create',
      entityType: 'Counterparty',
      entityId: supplierId,
      createdAt: atTime(daysBefore(today, 400 - position * 12), 11, 0),
    });
  });

  logs.push({
    tenantId,
    ...actorAt(0),
    action: 'settings.branding.update',
    entityType: 'Tenant',
    entityId: tenantId,
    createdAt: atTime(daysBefore(today, 300), 16, 0),
  });

  await context.transaction.auditLog.createMany({ data: logs });
}
