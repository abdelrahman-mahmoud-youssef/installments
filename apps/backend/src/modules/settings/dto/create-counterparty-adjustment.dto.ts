import { PaymentDirection } from '@prisma/client';
import { IsDateString, IsEnum, IsInt, IsOptional, IsPositive, IsString, MaxLength } from 'class-validator';

export class CreateCounterpartyAdjustmentDto {
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
  @MaxLength(500)
  note?: string;
}
