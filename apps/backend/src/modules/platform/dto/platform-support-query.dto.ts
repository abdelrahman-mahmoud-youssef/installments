import { IsIn, IsOptional } from 'class-validator';
import { PaginationQueryDto } from '../../../common/pagination/pagination-query.dto';

export const SupportReplyState = {
  AWAITING_REPLY: 'AWAITING_REPLY',
  REPLIED: 'REPLIED',
} as const;

export type SupportReplyState = (typeof SupportReplyState)[keyof typeof SupportReplyState];

export class PlatformSupportQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsIn(Object.values(SupportReplyState))
  state?: SupportReplyState;
}
