import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ActivateTenantDto } from './activate-tenant.dto';

async function invalidFields(body: object): Promise<string[]> {
  const errors = await validate(plainToInstance(ActivateTenantDto, body));
  return errors.map((error) => error.property).sort();
}

describe('ActivateTenantDto', () => {
  it('accepts a plan with a payment method', async () => {
    expect(await invalidFields({ source: 'PLAN', planId: 'plan_monthly', paymentMethod: 'INSTAPAY' })).toEqual([]);
  });

  it('requires the plan for a plan and the offer for an offer', async () => {
    expect(await invalidFields({ source: 'PLAN', paymentMethod: 'INSTAPAY' })).toEqual(['planId']);
    expect(await invalidFields({ source: 'OFFER', paymentMethod: 'INSTAPAY' })).toEqual(['offerId']);
  });

  it('requires months and amount for a manual activation', async () => {
    expect(await invalidFields({ source: 'MANUAL', paymentMethod: 'FREE' })).toEqual(['amount', 'months']);
    expect(await invalidFields({ source: 'MANUAL', months: 2, amount: 0, paymentMethod: 'FREE' })).toEqual([]);
  });

  it('rejects an unknown source, a missing payment method and a malformed paid date', async () => {
    expect(await invalidFields({ source: 'REFERRAL_REWARD', paidAt: '18/11/2026' })).toEqual([
      'paidAt',
      'paymentMethod',
      'source',
    ]);
  });
});
