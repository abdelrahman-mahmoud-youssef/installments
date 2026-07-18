import { IsEnum } from 'class-validator';
import { NotificationLanguage } from '@prisma/client';

export class SetTelegramLanguageDto {
  @IsEnum(NotificationLanguage)
  language!: NotificationLanguage;
}
