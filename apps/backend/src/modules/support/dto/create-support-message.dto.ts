import { IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSupportMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  subject!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  message!: string;
}
