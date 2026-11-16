import { Body, Controller, Delete, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AllowWithoutSubscription } from '../../common/decorators/allow-without-subscription.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterPushDeviceDto } from './dto/register-push-device.dto';
import { UnregisterPushDeviceDto } from './dto/unregister-push-device.dto';
import { PushService } from './push.service';

@AllowWithoutSubscription()
@Controller('push/devices')
export class PushDevicesController {
  constructor(private readonly pushService: PushService) {}

  @Post()
  @HttpCode(HttpStatus.NO_CONTENT)
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterPushDeviceDto) {
    return this.pushService.registerDevice(user, dto);
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  unregister(@CurrentUser() user: AuthenticatedUser, @Body() dto: UnregisterPushDeviceDto) {
    return this.pushService.unregisterDevice(user, dto.token);
  }
}
