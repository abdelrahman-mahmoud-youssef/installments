import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateContractTagDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  tag?: string;
}
