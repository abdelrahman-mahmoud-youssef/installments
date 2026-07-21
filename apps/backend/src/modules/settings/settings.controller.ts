import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SetNotificationLanguageDto } from './dto/set-notification-language.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { NotificationSettings, SettingsService } from './settings.service';

@Controller('settings/notifications')
@Roles(Role.ADMIN)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  getNotifications(@CurrentUser() user: AuthenticatedUser): Promise<NotificationSettings> {
    return this.settingsService.getNotifications(user.tenantId);
  }

  @Patch()
  @Audit('settings.notifications.update', 'Tenant')
  updateNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSettings> {
    return this.settingsService.updateNotifications(user.tenantId, dto);
  }

  @Patch('language')
  @Audit('settings.notifications.set_language', 'Tenant')
  setLanguage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetNotificationLanguageDto,
  ): Promise<NotificationSettings> {
    return this.settingsService.setLanguage(user.tenantId, dto.language);
  }

  @Post('test')
  @HttpCode(HttpStatus.NO_CONTENT)
  sendTest(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.settingsService.sendTest(user.tenantId);
  }

  @Delete()
  @Audit('settings.notifications.disconnect', 'Tenant')
  disconnect(@CurrentUser() user: AuthenticatedUser): Promise<NotificationSettings> {
    return this.settingsService.disconnect(user.tenantId);
  }
}
