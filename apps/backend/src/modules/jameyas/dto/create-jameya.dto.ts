import { RecurrenceType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsDivisibleBy,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  JAMEYA_MAX_GRACE_DAYS,
  JAMEYA_MAX_HOLDERS_PER_TURN,
  JAMEYA_MAX_SHARE_AMOUNT,
  JAMEYA_MAX_TURNS,
  JAMEYA_MIN_TURNS,
  JAMEYA_NAME_MAX_LENGTH,
  JAMEYA_NOTE_MAX_LENGTH,
  JAMEYA_WHOLE_POUND,
} from '../../../common/constants';

export const JAMEYA_RECURRENCE_TYPES = [RecurrenceType.MONTHLY, RecurrenceType.WEEKLY] as const;

export const WHOLE_POUNDS_MESSAGE = { message: '$property must be a whole number of pounds.' };

export class JameyaTurnHolderDto {
  @IsString()
  customerId!: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  @IsDivisibleBy(JAMEYA_WHOLE_POUND, WHOLE_POUNDS_MESSAGE)
  @Max(JAMEYA_MAX_SHARE_AMOUNT)
  contribution?: number;
}

export class JameyaTurnDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(JAMEYA_MAX_HOLDERS_PER_TURN)
  @ValidateNested({ each: true })
  @Type(() => JameyaTurnHolderDto)
  holders!: JameyaTurnHolderDto[];
}

export class CreateJameyaDto {
  @IsString()
  @MinLength(1)
  @MaxLength(JAMEYA_NAME_MAX_LENGTH)
  name!: string;

  @IsInt()
  @IsPositive()
  @IsDivisibleBy(JAMEYA_WHOLE_POUND, WHOLE_POUNDS_MESSAGE)
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

  @ValidateIf((dto: CreateJameyaDto) => dto.customerIds === undefined)
  @IsArray()
  @ArrayMinSize(JAMEYA_MIN_TURNS)
  @ArrayMaxSize(JAMEYA_MAX_TURNS)
  @ValidateNested({ each: true })
  @Type(() => JameyaTurnDto)
  turns?: JameyaTurnDto[];

  @ValidateIf((dto: CreateJameyaDto) => dto.turns === undefined)
  @IsArray()
  @ArrayMinSize(JAMEYA_MIN_TURNS)
  @ArrayMaxSize(JAMEYA_MAX_TURNS)
  @IsString({ each: true })
  customerIds?: string[];
}
