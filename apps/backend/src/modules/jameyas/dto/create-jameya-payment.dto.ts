import { IsDateString, IsInt, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from 'class-validator';
import { JAMEYA_NOTE_MAX_LENGTH, JAMEYA_RECEIPT_IMAGE_MAX_UPLOAD_BYTES } from '../../../common/constants';

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

  @IsOptional()
  @IsString()
  @MaxLength(Math.ceil((JAMEYA_RECEIPT_IMAGE_MAX_UPLOAD_BYTES * 4) / 3))
  image?: string;

  @IsUUID()
  clientRequestId!: string;
}
