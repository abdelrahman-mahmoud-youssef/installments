import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MAX_ABOUT_IMAGE_UPLOAD_BYTES } from '../../../common/constants';

export class UploadAboutImageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(Math.ceil((MAX_ABOUT_IMAGE_UPLOAD_BYTES * 4) / 3))
  image!: string;
}
