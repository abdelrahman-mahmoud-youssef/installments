import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SetNotificationLanguageDto } from './dto/set-notification-language.dto';
import { SetTelegramPublicVisibilityDto } from './dto/set-telegram-public-visibility.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';
import { UpdateReminderMessageSettingsDto } from './dto/update-reminder-message-settings.dto';
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

  @Patch('public-page-visibility')
  @Audit('settings.notifications.set_telegram_public_visibility', 'Tenant')
  setTelegramPublicVisibility(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SetTelegramPublicVisibilityDto,
  ): Promise<NotificationSettings> {
    return this.settingsService.setTelegramPublicVisibility(user.tenantId, dto);
  }

  @Patch('reminder-message')
  @Audit('settings.notifications.update_reminder_message', 'Tenant')
  updateReminderMessageSettings(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateReminderMessageSettingsDto,
  ): Promise<NotificationSettings> {
    return this.settingsService.updateReminderMessageSettings(user.tenantId, dto);
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
