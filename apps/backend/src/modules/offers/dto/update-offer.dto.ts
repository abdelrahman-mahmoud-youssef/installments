import { ArrayMaxSize, IsArray, IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_OFFER_IMAGE_UPLOAD_BYTES, MAX_OFFER_IMAGES } from '../../../common/constants';

const MAX_BASE64_IMAGE_LENGTH = Math.ceil((MAX_OFFER_IMAGE_UPLOAD_BYTES * 4) / 3);

export class UpdateOfferDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  tag?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_OFFER_IMAGES)
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  images?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_OFFER_IMAGES)
  @IsString({ each: true })
  @MaxLength(MAX_BASE64_IMAGE_LENGTH, { each: true })
  newImages?: string[];
}
