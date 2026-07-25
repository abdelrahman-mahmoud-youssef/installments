import { IsString, Matches, MaxLength } from 'class-validator';
import { SHARE_LINK_TARGET_PATH_PATTERN } from '../../../common/constants';

export class CreateShareLinkDto {
  @IsString()
  @MaxLength(300)
  @Matches(SHARE_LINK_TARGET_PATH_PATTERN, { message: 'This link cannot be shortened.' })
  targetPath!: string;
}
