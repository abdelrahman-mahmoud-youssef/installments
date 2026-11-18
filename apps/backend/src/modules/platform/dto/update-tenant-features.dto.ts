import { IsBoolean } from 'class-validator';

export class UpdateTenantFeaturesDto {
  @IsBoolean()
  jameyaEnabled!: boolean;
}
