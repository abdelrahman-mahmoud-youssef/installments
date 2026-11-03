import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_SUPPORT_IMAGE_UPLOAD_BYTES, SUPPORT_MESSAGE_MAX_LENGTH } from '../../../common/constants';

export class CreateSupportMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(SUPPORT_MESSAGE_MAX_LENGTH)
  message!: string;

  @IsOptional()
  @IsString()
  @MaxLength(Math.ceil((MAX_SUPPORT_IMAGE_UPLOAD_BYTES * 4) / 3))
  image?: string;
}
