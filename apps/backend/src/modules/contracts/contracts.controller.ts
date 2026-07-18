import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { ContractsService } from './contracts.service';
import { ContractQueryDto } from './dto/contract-query.dto';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractStatusDto } from './dto/update-contract-status.dto';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
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
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() updateContractStatusDto: UpdateContractStatusDto,
  ) {
    return this.contractsService.cancel(user.tenantId, id);
  }
}
