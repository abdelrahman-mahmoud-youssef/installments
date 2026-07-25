import { IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class OfferQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  q?: string;
}
