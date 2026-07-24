import { IsInt, IsOptional, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';

export class CreatePaymentMethodDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  label!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(300)
  details!: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  presetKey?: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  monthlyLimit?: number;
}
