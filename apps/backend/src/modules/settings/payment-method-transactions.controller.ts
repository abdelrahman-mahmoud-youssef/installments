import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreatePaymentMethodTransactionDto } from './dto/create-payment-method-transaction.dto';
import { PaymentMethodSummaryQueryDto } from './dto/payment-method-summary-query.dto';
import { PaymentMethodTransactionQueryDto } from './dto/payment-method-transaction-query.dto';
import { PaymentMethodTransactionsService } from './payment-method-transactions.service';

@Controller('settings/payment-methods/:paymentMethodId/transactions')
@Roles(Role.ADMIN)
export class PaymentMethodTransactionsController {
  constructor(private readonly paymentMethodTransactionsService: PaymentMethodTransactionsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('paymentMethodId') paymentMethodId: string,
    @Query() query: PaymentMethodTransactionQueryDto,
  ) {
    return this.paymentMethodTransactionsService.findAll(user.tenantId, paymentMethodId, query);
  }

  @Get('summary')
  getMonthlySummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param('paymentMethodId') paymentMethodId: string,
    @Query() query: PaymentMethodSummaryQueryDto,
  ) {
    return this.paymentMethodTransactionsService.getMonthlySummary(user.tenantId, paymentMethodId, query.month);
  }

  @Post()
  @Audit('paymentMethodTransaction.create', 'PaymentMethodTransaction')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param('paymentMethodId') paymentMethodId: string,
    @Body() dto: CreatePaymentMethodTransactionDto,
  ) {
    return this.paymentMethodTransactionsService.create(user.tenantId, paymentMethodId, dto);
  }
}
