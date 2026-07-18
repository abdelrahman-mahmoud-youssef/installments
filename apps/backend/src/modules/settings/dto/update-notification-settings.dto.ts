import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateNotificationSettingsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  telegramBotToken!: string;
}
