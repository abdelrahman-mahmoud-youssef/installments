import { toUtcMidnight } from '../../../common/date/utc-date';
import { ActivateTenantDto } from '../dto/activate-tenant.dto';
import { SubscriptionActivationItem, SubscriptionPaymentDetails } from './subscription-activation';

export function toActivationItem(dto: ActivateTenantDto): SubscriptionActivationItem {
  switch (dto.source) {
    case 'PLAN':
      return { source: 'PLAN', planId: dto.planId! };
    case 'OFFER':
      return { source: 'OFFER', offerId: dto.offerId! };
    case 'MANUAL':
      return { source: 'MANUAL', months: dto.months!, amount: dto.amount! };
  }
}

export function toPaymentDetails(dto: ActivateTenantDto, today: Date): SubscriptionPaymentDetails {
  return {
    amount: dto.amount,
    paidAt: dto.paidAt ? toUtcMidnight(new Date(dto.paidAt)) : today,
    paymentMethod: dto.paymentMethod,
    reference: dto.reference,
    note: dto.note,
  };
}
