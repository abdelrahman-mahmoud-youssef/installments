import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @IsString()
  password!: string;

  @IsOptional()
  @IsString()
  @MinLength(6)
  @MaxLength(11)
  code?: string;
}
