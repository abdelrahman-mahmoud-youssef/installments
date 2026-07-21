import { IsOptional, IsString, MaxLength } from 'class-validator';

export class DeclineClaimDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
