import { IsBoolean } from 'class-validator';

export class SetOffersVisibilityDto {
  @IsBoolean()
  showOffersOnPublicPage!: boolean;
}
