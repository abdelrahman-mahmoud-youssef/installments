import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { NotificationSettings, SettingsService } from './settings.service';

@Controller('settings/notifications')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getNotifications(@CurrentUser() user: AuthenticatedUser): Promise<NotificationSettings> {
    return this.settingsService.getNotifications(user.tenantId);
  }

  @Patch()
  updateNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    return this.settingsService.updateNotifications(user.tenantId, dto);
  }

  @Post('test')
  @HttpCode(HttpStatus.NO_CONTENT)
  sendTest(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.settingsService.sendTest(user.tenantId);
  }
}
