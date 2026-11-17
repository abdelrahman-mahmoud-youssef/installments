import { SubscriptionPaymentMethod, SubscriptionSource } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../../common/pagination/pagination-query.dto';

export class PlatformPaymentQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsDateString({ strict: true })
  from?: string;

  @IsOptional()
  @IsDateString({ strict: true })
  to?: string;

  @IsOptional()
  @IsEnum(SubscriptionSource)
  source?: SubscriptionSource;

  @IsOptional()
  @IsString()
  planId?: string;

  @IsOptional()
  @IsString()
  offerId?: string;

  @IsOptional()
  @IsEnum(SubscriptionPaymentMethod)
  paymentMethod?: SubscriptionPaymentMethod;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;
}
