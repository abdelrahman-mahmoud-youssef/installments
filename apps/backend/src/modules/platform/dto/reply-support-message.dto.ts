import { IsString, MaxLength, MinLength } from 'class-validator';
import { SUPPORT_MESSAGE_MAX_LENGTH } from '../../../common/constants';

export class ReplySupportMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(SUPPORT_MESSAGE_MAX_LENGTH)
  reply!: string;
}
