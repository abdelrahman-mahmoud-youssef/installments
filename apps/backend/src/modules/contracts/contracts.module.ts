import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
  imports: [StorageModule],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}
