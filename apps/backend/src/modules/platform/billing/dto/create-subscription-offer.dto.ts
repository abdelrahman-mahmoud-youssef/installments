import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import {
  SUBSCRIPTION_MAX_MONTHS,
  SUBSCRIPTION_MAX_PRICE,
  SUBSCRIPTION_NAME_MAX_LENGTH,
} from '../../../../common/constants';

export class CreateSubscriptionOfferDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(SUBSCRIPTION_NAME_MAX_LENGTH)
  nameEn!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(SUBSCRIPTION_NAME_MAX_LENGTH)
  nameAr!: string;

  @IsInt()
  @Min(1)
  @Max(SUBSCRIPTION_MAX_MONTHS)
  months!: number;

  @IsInt()
  @Min(0)
  @Max(SUBSCRIPTION_MAX_PRICE)
  price!: number;

  @IsInt()
  @Min(0)
  @Max(SUBSCRIPTION_MAX_PRICE)
  regularPrice!: number;

  @IsDateString({ strict: true })
  startsOn!: string;

  @IsDateString({ strict: true })
  endsOn!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
