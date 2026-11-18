import { IsDateString, IsInt, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';
import { JAMEYA_NOTE_MAX_LENGTH } from '../../../common/constants';

export class CreateJameyaPaymentDto {
  @IsString()
  customerId!: string;

  @IsInt()
  @IsPositive()
  amount!: number;

  @IsOptional()
  @IsDateString()
  paidAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(JAMEYA_NOTE_MAX_LENGTH)
  note?: string;

  @IsUUID()
  clientRequestId!: string;
}
