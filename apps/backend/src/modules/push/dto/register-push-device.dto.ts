import { NotificationLanguage } from '@prisma/client';
import { IsEnum, IsString, Matches } from 'class-validator';

const EXPO_PUSH_TOKEN_PATTERN = /^(Expo|Exponent)PushToken\[[^\]]+\]$/;

export class RegisterPushDeviceDto {
  @IsString()
  @Matches(EXPO_PUSH_TOKEN_PATTERN)
  token!: string;

  @IsEnum(NotificationLanguage)
  language!: NotificationLanguage;
}
