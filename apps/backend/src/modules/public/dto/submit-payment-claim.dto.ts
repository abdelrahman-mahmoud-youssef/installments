import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MAX_PAYMENT_PROOF_UPLOAD_BYTES } from '../../../common/constants';

export class SubmitPaymentClaimDto {
  @IsString()
  @IsNotEmpty()
  paymentMethodId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(Math.ceil((MAX_PAYMENT_PROOF_UPLOAD_BYTES * 4) / 3))
  screenshot!: string;
}
