import { PaymentClaimStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class PaymentClaimQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(PaymentClaimStatus)
  status?: PaymentClaimStatus;
}
