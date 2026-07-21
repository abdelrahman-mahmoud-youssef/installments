import { IsString, MaxLength, MinLength } from 'class-validator';

export class DisableTwoFactorDto {
  @IsString()
  @MinLength(6)
  @MaxLength(11)
  code!: string;
}
