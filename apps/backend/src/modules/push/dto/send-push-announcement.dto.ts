import { PushAudience } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { PUSH_BODY_MAX_LENGTH, PUSH_TITLE_MAX_LENGTH } from '../../../common/constants';

export class SendPushAnnouncementDto {
  @IsString()
  @MinLength(1)
  @MaxLength(PUSH_TITLE_MAX_LENGTH)
  title!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(PUSH_BODY_MAX_LENGTH)
  body!: string;

  @IsEnum(PushAudience)
  audience!: PushAudience;

  @ValidateIf((dto: SendPushAnnouncementDto) => dto.audience === PushAudience.SHOP)
  @IsString()
  @MinLength(1)
  tenantId?: string;
}
