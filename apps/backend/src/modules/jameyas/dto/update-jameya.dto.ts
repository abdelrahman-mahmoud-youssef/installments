import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateJameyaDto } from './create-jameya.dto';

export class UpdateJameyaDto extends PartialType(PickType(CreateJameyaDto, ['name', 'notes'] as const)) {}
