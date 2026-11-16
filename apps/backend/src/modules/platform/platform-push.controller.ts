import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import {
  AuthenticatedPlatformAdmin,
  CurrentPlatformAdmin,
} from '../../common/decorators/current-platform-admin.decorator';
import { PlatformRoute } from '../../common/decorators/platform-route.decorator';
import { PaginationQueryDto } from '../../common/pagination/pagination-query.dto';
import { SendPushAnnouncementDto } from '../push/dto/send-push-announcement.dto';
import { PushAnnouncementsService } from '../push/push-announcements.service';

@PlatformRoute()
@Controller('platform/push')
export class PlatformPushController {
  constructor(private readonly pushAnnouncementsService: PushAnnouncementsService) {}

  @Get()
  findAll(@CurrentPlatformAdmin() _admin: AuthenticatedPlatformAdmin, @Query() query: PaginationQueryDto) {
    return this.pushAnnouncementsService.findAll(query);
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  send(@CurrentPlatformAdmin() _admin: AuthenticatedPlatformAdmin, @Body() dto: SendPushAnnouncementDto) {
    return this.pushAnnouncementsService.send(dto);
  }
}
