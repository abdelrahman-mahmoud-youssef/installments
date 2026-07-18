import { ContractStatus } from '@prisma/client';
import { IsIn } from 'class-validator';

export class UpdateContractStatusDto {
  @IsIn([ContractStatus.CANCELLED])
  status!: ContractStatus;
}
