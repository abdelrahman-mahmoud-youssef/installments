import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class CustomerQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}
