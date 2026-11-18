import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { CreateJameyaPaymentDto } from './dto/create-jameya-payment.dto';
import { CreateJameyaPayoutDto } from './dto/create-jameya-payout.dto';
import { CreateJameyaDto } from './dto/create-jameya.dto';
import { JameyaQueryDto } from './dto/jameya-query.dto';
import { UpdateJameyaDto } from './dto/update-jameya.dto';
import { JameyaEnabledGuard } from './jameya-enabled.guard';
import { JameyaPaymentsService } from './jameya-payments.service';
import { JameyaPayoutsService } from './jameya-payouts.service';
import { JameyasService } from './jameyas.service';

@UseGuards(JameyaEnabledGuard)
@Controller('jameyas')
export class JameyasController {
  constructor(
    private readonly jameyasService: JameyasService,
    private readonly jameyaPaymentsService: JameyaPaymentsService,
    private readonly jameyaPayoutsService: JameyaPayoutsService,
  ) {}

  @Post()
  @Audit('jameya.create', 'Jameya')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateJameyaDto) {
    return this.jameyasService.create(user.tenantId, dto);
  }

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  preview(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateJameyaDto) {
    return this.jameyasService.preview(user.tenantId, dto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: JameyaQueryDto) {
    return this.jameyasService.findAll(user.tenantId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.jameyasService.findOne(user.tenantId, id);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @Audit('jameya.update', 'Jameya')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateJameyaDto) {
    return this.jameyasService.update(user.tenantId, id, dto);
  }

  @Post(':id/payments')
  @Audit('jameyaPayment.create', 'Jameya')
  createPayment(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateJameyaPaymentDto) {
    return this.jameyaPaymentsService.create(user.tenantId, id, dto);
  }

  @Get(':id/payments')
  findPayments(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Query() query: PaginationQueryDto) {
    return this.jameyaPaymentsService.findAll(user.tenantId, id, query);
  }

  @Post(':id/cycles/:cycleId/payouts')
  @Roles(Role.ADMIN)
  @Audit('jameyaPayout.create', 'Jameya')
  createPayout(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('cycleId') cycleId: string,
    @Body() dto: CreateJameyaPayoutDto,
  ) {
    return this.jameyaPayoutsService.create(user.tenantId, id, cycleId, dto);
  }
}
