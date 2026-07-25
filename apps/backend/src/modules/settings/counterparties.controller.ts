import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CounterpartiesService } from './counterparties.service';
import { CounterpartyHistoryQueryDto } from './dto/counterparty-history-query.dto';
import { CounterpartyQueryDto } from './dto/counterparty-query.dto';
import { CreateCounterpartyAdjustmentDto } from './dto/create-counterparty-adjustment.dto';
import { CreateCounterpartyDto } from './dto/create-counterparty.dto';
import { UpdateCounterpartyDto } from './dto/update-counterparty.dto';

@Controller('settings/counterparties')
@Roles(Role.ADMIN)
export class CounterpartiesController {
  constructor(private readonly counterpartiesService: CounterpartiesService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: CounterpartyQueryDto) {
    return this.counterpartiesService.findAll(user.tenantId, query);
  }

  @Post()
  @Audit('counterparty.create', 'Counterparty')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCounterpartyDto) {
    return this.counterpartiesService.create(user.tenantId, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.counterpartiesService.findOne(user.tenantId, id);
  }

  @Get(':id/history')
  getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: CounterpartyHistoryQueryDto,
  ) {
    return this.counterpartiesService.getHistory(user.tenantId, id, query);
  }

  @Patch(':id')
  @Audit('counterparty.update', 'Counterparty')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCounterpartyDto) {
    return this.counterpartiesService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit('counterparty.delete', 'Counterparty')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.counterpartiesService.remove(user.tenantId, id);
  }

  @Post(':id/adjustments')
  @Audit('counterparty.adjustment.create', 'CounterpartyAdjustment')
  createAdjustment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CreateCounterpartyAdjustmentDto,
  ) {
    return this.counterpartiesService.createAdjustment(user.tenantId, id, dto);
  }
}
