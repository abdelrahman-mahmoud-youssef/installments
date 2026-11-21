import { RecurrenceType } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import {
  JAMEYA_MAX_GRACE_DAYS,
  JAMEYA_MAX_SHARE_AMOUNT,
  JAMEYA_MAX_TURNS,
  JAMEYA_MIN_TURNS,
  JAMEYA_NAME_MAX_LENGTH,
  JAMEYA_NOTE_MAX_LENGTH,
} from '../../../common/constants';

export const JAMEYA_RECURRENCE_TYPES = [RecurrenceType.MONTHLY, RecurrenceType.WEEKLY] as const;

export class CreateJameyaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(JAMEYA_NAME_MAX_LENGTH)
  name!: string;

  @IsInt()
  @IsPositive()
  @Max(JAMEYA_MAX_SHARE_AMOUNT)
  shareAmount!: number;

  @IsIn(JAMEYA_RECURRENCE_TYPES)
  recurrenceType!: (typeof JAMEYA_RECURRENCE_TYPES)[number];

  @IsDateString({ strict: true })
  firstDueDate!: string;

  @IsInt()
  @Min(0)
  @Max(JAMEYA_MAX_GRACE_DAYS)
  graceDays!: number;

  @IsOptional()
  @IsString()
  @MaxLength(JAMEYA_NOTE_MAX_LENGTH)
  notes?: string;

  @IsArray()
  @ArrayMinSize(JAMEYA_MIN_TURNS)
  @ArrayMaxSize(JAMEYA_MAX_TURNS)
  @IsString({ each: true })
  customerIds!: string[];
}
