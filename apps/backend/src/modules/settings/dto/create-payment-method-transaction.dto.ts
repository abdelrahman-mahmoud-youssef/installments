import { PaymentDirection } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';
import { MAX_PAYMENT_METHOD_TRANSACTION_IMAGE_UPLOAD_BYTES } from '../../../common/constants';

export class CreatePaymentMethodTransactionDto {
  @IsEnum(PaymentDirection)
  direction!: PaymentDirection;

  @IsInt()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  counterpartyName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  counterpartyPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;

  @IsOptional()
  @IsString()
  @MaxLength(Math.ceil((MAX_PAYMENT_METHOD_TRANSACTION_IMAGE_UPLOAD_BYTES * 4) / 3))
  image?: string;
}
