import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { RemindersService } from './reminders.service';

@Controller('reminders')
export class RemindersController {
  constructor(private readonly remindersService: RemindersService) {}

  @Post('test')
  @HttpCode(HttpStatus.NO_CONTENT)
  sendTest(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.remindersService.sendTestReminder(user.tenantId);
  }
}
