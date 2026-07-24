import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreatePaymentMethodTransactionDto } from './dto/create-payment-method-transaction.dto';
import { PaymentMethodTransactionsService } from './payment-method-transactions.service';

@Controller('settings/payment-methods/:paymentMethodId/transactions')
@Roles(Role.ADMIN)
export class PaymentMethodTransactionsController {
  constructor(private readonly paymentMethodTransactionsService: PaymentMethodTransactionsService) {}

  @Get()
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Param('paymentMethodId') paymentMethodId: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.paymentMethodTransactionsService.findAll(user.tenantId, paymentMethodId, query);
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
