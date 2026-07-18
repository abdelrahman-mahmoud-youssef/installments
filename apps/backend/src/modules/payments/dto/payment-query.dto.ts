import { IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class PaymentQueryDto extends PaginationQueryDto {
  @IsString()
  contractId!: string;
}
