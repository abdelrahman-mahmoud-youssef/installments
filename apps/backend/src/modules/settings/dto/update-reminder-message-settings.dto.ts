import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateReminderMessageSettingsDto {
  @IsOptional()
  @IsBoolean()
  showProgress?: boolean;

  @IsOptional()
  @IsBoolean()
  showRemaining?: boolean;

  @IsOptional()
  @IsBoolean()
  showLocation?: boolean;

  @IsOptional()
  @IsBoolean()
  showPayLink?: boolean;
}
