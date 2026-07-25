import { IsBoolean } from 'class-validator';

export class SetTelegramPublicVisibilityDto {
  @IsBoolean()
  showTelegramOnPublicPage!: boolean;
}
