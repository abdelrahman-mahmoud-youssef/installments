import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ContractsService } from './contracts.service';
import { ContractQueryDto } from './dto/contract-query.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Audit('contract.create', 'Contract')
  create(@CurrentUser() user: AuthenticatedUser, @Body() createContractDto: CreateContractDto) {
    return this.contractsService.create(user.tenantId, createContractDto);
  }

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ContractQueryDto) {
    return this.contractsService.findAll(user.tenantId, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.contractsService.findOne(user.tenantId, id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN)
  @Audit('contract.cancel', 'Contract')
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateContractStatusDto: UpdateContractStatusDto,
  ) {
    return this.contractsService.cancel(user.tenantId, id);
  }
}
