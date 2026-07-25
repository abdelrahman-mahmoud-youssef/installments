import { Module } from '@nestjs/common';
import { ShareLinksModule } from '../share-links/share-links.module';
import { StorageModule } from '../storage/storage.module';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';

@Module({
  imports: [StorageModule, ShareLinksModule],
  controllers: [ContractsController],
  providers: [ContractsService],
})
export class ContractsModule {}
