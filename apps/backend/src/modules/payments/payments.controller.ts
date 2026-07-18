import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentQueryDto } from './dto/payment-query.dto';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(user.tenantId, createPaymentDto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PaymentQueryDto) {
    return this.paymentsService.findAll(user.tenantId, query);
  }
}
