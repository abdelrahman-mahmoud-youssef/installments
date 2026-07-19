import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
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
}
