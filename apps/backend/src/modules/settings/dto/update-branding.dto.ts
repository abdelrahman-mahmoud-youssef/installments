import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { BRAND_COLOR_PRESETS, BrandColorPreset } from '../../../common/constants';

export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsIn(BRAND_COLOR_PRESETS)
  brandColor?: BrandColorPreset;

  @IsOptional()
  @IsBoolean()
  showPublicPricing?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  about?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  instagramUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  facebookUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  tiktokUrl?: string;

  @IsOptional()
  @IsBoolean()
  showInstallmentCalculator?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  calculatorMarkupPercent?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(12)
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(60, { each: true })
  calculatorInstallmentMonths?: number[];
}
