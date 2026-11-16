import { IsIn, IsInt, IsOptional, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';
import { PAYMENT_METHOD_ICON_KEYS } from '../../../common/constants';

export class CreatePaymentMethodDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  details!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  presetKey?: string;

  @IsOptional()
  @IsIn(PAYMENT_METHOD_ICON_KEYS)
  iconKey?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  monthlyLimit?: number;
}
