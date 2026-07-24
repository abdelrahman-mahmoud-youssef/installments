import { IsOptional, IsString, Matches } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class PaymentMethodTransactionQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: 'month must be in YYYY-MM format.' })
  month?: string;
}
