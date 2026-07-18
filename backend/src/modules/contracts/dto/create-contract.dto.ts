import { CalculationMethod, RecurrenceType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsPositive,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateContractDto {
  @IsString()
  customerId!: string;

  @IsString()
  @MinLength(1)
  productName!: string;

  @IsInt()
  @IsPositive()
  productPrice!: number;

  @IsInt()
  @Min(0)
  downPayment!: number;

  @IsEnum(CalculationMethod)
  calculationMethod!: CalculationMethod;

  @ValidateIf((dto: CreateContractDto) => dto.calculationMethod === CalculationMethod.MARKUP_PERCENT)
  @IsPositive()
  markupPercent?: number;

  @ValidateIf(
    (dto: CreateContractDto) =>
      dto.calculationMethod === CalculationMethod.FIXED_COUNT ||
      dto.calculationMethod === CalculationMethod.MARKUP_PERCENT,
  )
  @IsInt()
  @IsPositive()
  installmentCount?: number;

  @ValidateIf((dto: CreateContractDto) => dto.calculationMethod === CalculationMethod.FIXED_AMOUNT)
  @IsInt()
  @IsPositive()
  fixedInstallmentAmount?: number;

  @IsEnum(RecurrenceType)
  recurrenceType!: RecurrenceType;

  @ValidateIf((dto: CreateContractDto) => dto.recurrenceType === RecurrenceType.EVERY_X_DAYS)
  @IsInt()
  @IsPositive()
  intervalDays?: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  firstPaymentDate!: string;
}
