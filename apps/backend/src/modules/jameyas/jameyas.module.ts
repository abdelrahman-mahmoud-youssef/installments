import { Module } from '@nestjs/common';
import { JameyaPaymentsService } from './jameya-payments.service';
import { JameyaPayoutsService } from './jameya-payouts.service';
import { JameyasController } from './jameyas.controller';
import { JameyasService } from './jameyas.service';

@Module({
  controllers: [JameyasController],
  providers: [JameyasService, JameyaPaymentsService, JameyaPayoutsService],
})
export class JameyasModule {}
