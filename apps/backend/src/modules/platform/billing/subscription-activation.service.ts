import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, SubscriptionSource, TenantSubscription } from '@prisma/client';
import { getUtcToday } from '../../../common/date/utc-date';
import { calculateNextSubscriptionPeriod, isOfferValidOn } from '../../../common/subscription/subscription';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  ResolvedSubscriptionItem,
  SubscriptionActivationItem,
  SubscriptionPaymentDetails,
} from './subscription-activation';

const FUTURE_PAID_DATE_ERROR = 'The paid date cannot be in the future.';
const PLAN_UNAVAILABLE_ERROR = 'This plan is not available.';
const OFFER_NOT_RUNNING_ERROR = 'This offer was not running on the paid date.';
const OFFER_ALREADY_USED_ERROR = 'This shop has already used this offer.';
const AMOUNT_ABOVE_FULL_PRICE_ERROR = 'The amount paid cannot be more than the full price.';
const CONCURRENT_UPDATE_ERROR = 'This shop was updated at the same time. Refresh and try again.';

@Injectable()
export class SubscriptionActivationService {
  constructor(private readonly prisma: PrismaService) {}

  async activate(
    tenantId: string,
    item: SubscriptionActivationItem,
    payment: SubscriptionPaymentDetails,
    activatedById: string,
  ): Promise<TenantSubscription> {
    const today = getUtcToday();
    if (payment.paidAt.getTime() > today.getTime()) {
      throw new BadRequestException(FUTURE_PAID_DATE_ERROR);
    }

    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.findUnique({
        where: { id: tenantId },
        select: { subscriptionExpiresOn: true },
      });
      if (!tenant) {
        throw new NotFoundException('Tenant not found.');
      }

      const resolved = await this.resolveItem(tx, tenantId, item, payment.paidAt);
      if (payment.amount !== undefined && payment.amount > resolved.listPrice) {
        throw new BadRequestException(AMOUNT_ABOVE_FULL_PRICE_ERROR);
      }
      const period = calculateNextSubscriptionPeriod(tenant.subscriptionExpiresOn, today, resolved.months);
      const { count } = await tx.tenant.updateMany({
        where: { id: tenantId, subscriptionExpiresOn: tenant.subscriptionExpiresOn },
        data: { subscriptionExpiresOn: period.periodEnd },
      });
      if (count === 0) {
        throw new ConflictException(CONCURRENT_UPDATE_ERROR);
      }

      return tx.tenantSubscription.create({
        data: {
          tenantId,
          periodStart: period.periodStart,
          periodEnd: period.periodEnd,
          months: resolved.months,
          source: SubscriptionSource[item.source],
          planId: resolved.planId,
          offerId: resolved.offerId,
          listPrice: resolved.listPrice,
          amount: payment.amount ?? resolved.price,
          paidAt: payment.paidAt,
          paymentMethod: payment.paymentMethod,
          reference: payment.reference,
          note: payment.note,
          activatedById,
        },
      });
    });
  }

  private async resolveItem(
    tx: Prisma.TransactionClient,
    tenantId: string,
    item: SubscriptionActivationItem,
    paidAt: Date,
  ): Promise<ResolvedSubscriptionItem> {
    switch (item.source) {
      case 'PLAN':
        return this.resolvePlan(tx, item.planId);
      case 'OFFER':
        return this.resolveOffer(tx, tenantId, item.offerId, paidAt);
      case 'MANUAL':
        return { months: item.months, listPrice: item.amount, price: item.amount, planId: null, offerId: null };
    }
  }

  private async resolvePlan(tx: Prisma.TransactionClient, planId: string): Promise<ResolvedSubscriptionItem> {
    const plan = await tx.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      throw new BadRequestException(PLAN_UNAVAILABLE_ERROR);
    }
    return { months: plan.months, listPrice: plan.price, price: plan.price, planId: plan.id, offerId: null };
  }

  private async resolveOffer(
    tx: Prisma.TransactionClient,
    tenantId: string,
    offerId: string,
    paidAt: Date,
  ): Promise<ResolvedSubscriptionItem> {
    const offer = await tx.subscriptionOffer.findUnique({ where: { id: offerId } });
    if (!offer || !isOfferValidOn(offer, paidAt)) {
      throw new BadRequestException(OFFER_NOT_RUNNING_ERROR);
    }
    const timesUsed = await tx.tenantSubscription.count({ where: { tenantId, offerId } });
    if (timesUsed > 0) {
      throw new BadRequestException(OFFER_ALREADY_USED_ERROR);
    }
    return {
      months: offer.months,
      listPrice: offer.regularPrice,
      price: offer.price,
      planId: null,
      offerId: offer.id,
    };
  }
}
