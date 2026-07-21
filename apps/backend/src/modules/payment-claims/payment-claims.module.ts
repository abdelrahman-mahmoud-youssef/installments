import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { PaymentClaimsController } from './payment-claims.controller';
import { PaymentClaimsService } from './payment-claims.service';

@Module({
  imports: [PaymentsModule],
  controllers: [PaymentClaimsController],
  providers: [PaymentClaimsService],
})
export class PaymentClaimsModule {}
