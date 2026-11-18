import { JameyaStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export class JameyaQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(JameyaStatus)
  status?: JameyaStatus;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsString()
  q?: string;
}
