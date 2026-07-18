import { IsBoolean } from 'class-validator';

export class SetTelegramEnabledDto {
  @IsBoolean()
  enabled!: boolean;
}
