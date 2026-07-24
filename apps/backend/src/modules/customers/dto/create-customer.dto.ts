import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { MAX_CUSTOMER_ID_UPLOAD_BYTES } from '../../../common/constants';

export class CreateCustomerDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(30)
  phone!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  address?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  @IsOptional()
  @IsString()
  @MaxLength(Math.ceil((MAX_CUSTOMER_ID_UPLOAD_BYTES * 4) / 3))
  idImage?: string;
}
