import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { BroadcastsService } from './broadcasts.service';
import { CreateBroadcastDto } from './dto/create-broadcast.dto';
import { SubscriberQueryDto } from './dto/subscriber-query.dto';

@Controller('announcements')
export class BroadcastsController {
  constructor(private readonly broadcastsService: BroadcastsService) {}

  @Get('subscribers')
  listSubscribers(@CurrentUser() user: AuthenticatedUser, @Query() query: SubscriberQueryDto) {
    return this.broadcastsService.listSubscribers(user.tenantId, query);
  }

  @Get()
  listBroadcasts(@CurrentUser() user: AuthenticatedUser, @Query() query: SubscriberQueryDto) {
    return this.broadcastsService.listBroadcasts(user.tenantId, query);
  }

  @Post()
  @Roles(Role.ADMIN)
  @Audit('announcement.send', 'Broadcast')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateBroadcastDto) {
    return this.broadcastsService.createBroadcast(user.tenantId, dto);
  }
}
