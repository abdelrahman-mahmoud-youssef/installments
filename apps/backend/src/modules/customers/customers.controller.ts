import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { Audit } from '../../common/decorators/audit.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { CustomerNotificationQueryDto } from './dto/customer-notification-query.dto';
import { CustomerQueryDto } from './dto/customer-query.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Audit('customer.create', 'Customer')
  create(@CurrentUser() user: AuthenticatedUser, @Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(user.tenantId, createCustomerDto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: CustomerQueryDto) {
    return this.customersService.findAll(user.tenantId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customersService.findOne(user.tenantId, id);
  }

  @Get(':id/notifications')
  getNotificationHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: CustomerNotificationQueryDto,
  ) {
    return this.customersService.getNotificationHistory(user.tenantId, id, query);
  }

  @Patch(':id')
  @Audit('customer.update', 'Customer')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
  ) {
    return this.customersService.update(user.tenantId, id, updateCustomerDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit('customer.delete', 'Customer')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.customersService.remove(user.tenantId, id);
  }
}
