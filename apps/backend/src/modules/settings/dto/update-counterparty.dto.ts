import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_CONTACT_PHOTO_UPLOAD_BYTES } from '../../../common/constants';

export class UpdateCounterpartyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(Math.ceil((MAX_CONTACT_PHOTO_UPLOAD_BYTES * 4) / 3))
  photo?: string;
}
