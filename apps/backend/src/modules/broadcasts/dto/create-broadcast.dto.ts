import { BroadcastAudience } from '@prisma/client';
import { ArrayNotEmpty, IsArray, IsEnum, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';

export class CreateBroadcastDto {
  @IsString()
  @MaxLength(4000)
  body!: string;

  @IsOptional()
  @IsString()
  @MaxLength(7_500_000)
  image?: string;

  @IsEnum(BroadcastAudience)
  audience!: BroadcastAudience;

  @ValidateIf((dto: CreateBroadcastDto) => dto.audience === BroadcastAudience.SELECTED)
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  customerIds?: string[];
}
