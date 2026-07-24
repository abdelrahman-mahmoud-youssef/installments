import { IsInt, IsOptional, Min } from 'class-validator';

export class ApproveClaimDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  amount?: number;
}
