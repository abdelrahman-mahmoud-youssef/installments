import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import {
  AuthenticatedPlatformAdmin,
  CurrentPlatformAdmin,
} from '../../common/decorators/current-platform-admin.decorator';
import { PlatformRoute } from '../../common/decorators/platform-route.decorator';
import { PlatformSupportQueryDto } from './dto/platform-support-query.dto';
import { ReplySupportMessageDto } from './dto/reply-support-message.dto';
import { PlatformSupportService } from './platform-support.service';

@PlatformRoute()
@Controller('platform/support')
export class PlatformSupportController {
  constructor(private readonly platformSupportService: PlatformSupportService) {}

  @Get()
  findAll(@CurrentPlatformAdmin() _admin: AuthenticatedPlatformAdmin, @Query() query: PlatformSupportQueryDto) {
    return this.platformSupportService.findAll(query);
  }

  @Get('awaiting-reply-count')
  countAwaitingReply(@CurrentPlatformAdmin() _admin: AuthenticatedPlatformAdmin) {
    return this.platformSupportService.countAwaitingReply();
  }

  @Post(':messageId/reply')
  @HttpCode(HttpStatus.OK)
  reply(
    @CurrentPlatformAdmin() _admin: AuthenticatedPlatformAdmin,
    @Param('messageId') messageId: string,
    @Body() dto: ReplySupportMessageDto,
  ) {
    return this.platformSupportService.reply(messageId, dto);
  }
}
