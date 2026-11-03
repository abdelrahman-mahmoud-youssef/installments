import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';
import { SubscriptionStatus } from '../../../common/subscription/subscription';

export class PlatformTenantQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  q?: string;

  @IsOptional()
  @IsIn(Object.values(SubscriptionStatus))
  status?: SubscriptionStatus;
}
