import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNotIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { ABOUT_MAX_LENGTH, BRAND_COLOR_PRESETS, BrandColorPreset, RESERVED_SUBDOMAINS } from '../../../common/constants';

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export class CalculatorPlanDto {
  @IsInt()
  @Min(1)
  @Max(60)
  months!: number;

  @IsNumber()
  @Min(0)
  @Max(1000)
  markupPercent!: number;
}

export class LocationDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  id!: string;

  @IsString()
  @MaxLength(80)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  address!: string;

  @IsOptional()
  @IsUrl({}, { message: 'Must be a valid URL.' })
  @MaxLength(500)
  mapUrl?: string;
}

export class UpdateBrandingDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(60)
  @Matches(SLUG_PATTERN, {
    message: 'Link can only contain lowercase letters, numbers, and single hyphens between them.',
  })
  @IsNotIn(RESERVED_SUBDOMAINS, { message: 'This link is reserved and cannot be used.' })
  slug?: string;

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
  @MaxLength(ABOUT_MAX_LENGTH)
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
  @IsArray()
  @ArrayMaxSize(12)
  @ValidateNested({ each: true })
  @Type(() => CalculatorPlanDto)
  calculatorPlans?: CalculatorPlanDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  locations?: LocationDto[];
}
