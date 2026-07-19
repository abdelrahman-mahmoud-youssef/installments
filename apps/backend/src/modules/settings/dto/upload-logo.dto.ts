import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MAX_LOGO_UPLOAD_BYTES } from '../../../common/constants';

export class UploadLogoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(Math.ceil((MAX_LOGO_UPLOAD_BYTES * 4) / 3))
  image!: string;
}
