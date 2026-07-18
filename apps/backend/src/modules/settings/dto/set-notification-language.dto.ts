import { IsEnum } from 'class-validator';
import { NotificationLanguage } from '@prisma/client';

export class SetNotificationLanguageDto {
  @IsEnum(NotificationLanguage)
  language!: NotificationLanguage;
}
