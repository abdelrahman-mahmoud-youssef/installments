import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { buildViewablePaymentMethodWhere } from '../settings/wallet-access/wallet-access';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @Audit('payment.create', 'Payment')
  create(@CurrentUser() user: AuthenticatedUser, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(user.tenantId, createPaymentDto, buildViewablePaymentMethodWhere(user));
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PaymentQueryDto) {
    return this.paymentsService.findAll(user.tenantId, query);
  }
}
