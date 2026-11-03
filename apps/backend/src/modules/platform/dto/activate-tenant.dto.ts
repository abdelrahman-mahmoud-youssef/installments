import { IsIn, IsOptional } from 'class-validator';
import { SubscriptionPricing } from '../../../common/subscription/subscription';

export class ActivateTenantDto {
  @IsOptional()
  @IsIn(Object.values(SubscriptionPricing))
  pricing?: SubscriptionPricing;
}
