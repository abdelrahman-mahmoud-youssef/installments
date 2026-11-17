import { SubscriptionPaymentMethod } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import {
  SUBSCRIPTION_MAX_MONTHS,
  SUBSCRIPTION_MAX_PRICE,
  SUBSCRIPTION_NOTE_MAX_LENGTH,
  SUBSCRIPTION_REFERENCE_MAX_LENGTH,
} from '../../../common/constants';
import { SubscriptionActivationItem } from '../billing/subscription-activation';

const ACTIVATION_SOURCES: SubscriptionActivationItem['source'][] = ['PLAN', 'OFFER', 'MANUAL'];

export class ActivateTenantDto {
  @IsIn(ACTIVATION_SOURCES)
  source!: SubscriptionActivationItem['source'];

  @ValidateIf((dto: ActivateTenantDto) => dto.source === 'PLAN')
  @IsString()
  planId?: string;

  @ValidateIf((dto: ActivateTenantDto) => dto.source === 'OFFER')
  @IsString()
  offerId?: string;

  @ValidateIf((dto: ActivateTenantDto) => dto.source === 'MANUAL')
  @IsInt()
  @Min(1)
  @Max(SUBSCRIPTION_MAX_MONTHS)
  months?: number;

  @ValidateIf((dto: ActivateTenantDto) => dto.source === 'MANUAL' || dto.amount !== undefined)
  @IsInt()
  @Min(0)
  @Max(SUBSCRIPTION_MAX_PRICE)
  amount?: number;

  @IsOptional()
  @IsDateString({ strict: true })
  paidAt?: string;

  @IsEnum(SubscriptionPaymentMethod)
  paymentMethod!: SubscriptionPaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(SUBSCRIPTION_REFERENCE_MAX_LENGTH)
  reference?: string;

  @IsOptional()
  @IsString()
  @MaxLength(SUBSCRIPTION_NOTE_MAX_LENGTH)
  note?: string;
}
