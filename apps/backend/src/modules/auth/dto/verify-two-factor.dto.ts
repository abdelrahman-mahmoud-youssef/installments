import { IsString, MaxLength, MinLength } from 'class-validator';

export class VerifyTwoFactorDto {
  @IsString()
  challengeToken!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(11)
  code!: string;
}
