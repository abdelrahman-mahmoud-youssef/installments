import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { UpdateStaffWalletAccessDto } from './dto/update-staff-wallet-access.dto';
import { UsersService } from './users.service';

@Controller('staff')
@Roles(Role.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  listStaff(@CurrentUser() user: AuthenticatedUser) {
    return this.usersService.listStaff(user.tenantId);
  }

  @Post()
  @Audit('staff.create', 'User')
  createStaff(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStaffDto) {
    return this.usersService.createStaff(user.tenantId, dto);
  }

  @Patch(':id')
  @Audit('staff.update_status', 'User')
  updateStaff(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.usersService.updateStaff(user.tenantId, user.userId, id, dto);
  }

  @Patch(':id/wallet-access')
  @Audit('staff.update_wallet_access', 'User')
  updateStaffWalletAccess(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateStaffWalletAccessDto,
  ) {
    return this.usersService.updateStaffWalletAccess(user.tenantId, user.userId, id, dto);
  }
}
