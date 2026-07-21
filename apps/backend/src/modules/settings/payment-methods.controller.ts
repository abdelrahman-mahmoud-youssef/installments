import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { PaymentMethod, Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreatePaymentMethodDto } from './dto/create-payment-method.dto';
import { UpdatePaymentMethodDto } from './dto/update-payment-method.dto';
import { PaymentMethodsService } from './payment-methods.service';

@Controller('settings/payment-methods')
@Roles(Role.ADMIN)
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  listPaymentMethods(@CurrentUser() user: AuthenticatedUser): Promise<PaymentMethod[]> {
    return this.paymentMethodsService.listPaymentMethods(user.tenantId);
  }

  @Post()
  @Audit('paymentMethod.create', 'PaymentMethod')
  createPaymentMethod(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    return this.paymentMethodsService.createPaymentMethod(user.tenantId, dto);
  }

  @Patch(':id')
  @Audit('paymentMethod.update', 'PaymentMethod')
  updatePaymentMethod(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentMethodDto,
  ): Promise<PaymentMethod> {
    return this.paymentMethodsService.updatePaymentMethod(user.tenantId, id, dto);
  }

  @Delete(':id')
  @Audit('paymentMethod.delete', 'PaymentMethod')
  deletePaymentMethod(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string): Promise<void> {
    return this.paymentMethodsService.deletePaymentMethod(user.tenantId, id);
  }
}
