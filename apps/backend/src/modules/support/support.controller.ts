import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AllowWithoutSubscription } from '../../common/decorators/allow-without-subscription.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateSupportMessageDto } from './dto/create-support-message.dto';
import { SupportService } from './support.service';

@AllowWithoutSubscription()
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Get()
  findMine(@CurrentUser() user: AuthenticatedUser) {
    return this.supportService.findMine(user);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSupportMessageDto) {
    return this.supportService.create(user, dto);
  }

  @Post('mark-seen')
  @HttpCode(HttpStatus.NO_CONTENT)
  markSeen(@CurrentUser() user: AuthenticatedUser) {
    return this.supportService.markSeen(user);
  }
}
