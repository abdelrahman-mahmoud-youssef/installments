import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { SetTelegramEnabledDto } from './dto/set-telegram-enabled.dto';
import { SetTelegramLanguageDto } from './dto/set-telegram-language.dto';
import { PublicService } from './public.service';

@Public()
@Throttle({ default: { limit: 20, ttl: 60_000 } })
@Controller('public/customers')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get(':publicId')
  getCustomer(@Param('publicId') publicId: string) {
    return this.publicService.getCustomerByPublicId(publicId);
  }

  @Post(':publicId/telegram/verify')
  verifyTelegram(@Param('publicId') publicId: string) {
    return this.publicService.verifyTelegram(publicId);
  }

  @Patch(':publicId/telegram')
  setTelegramEnabled(@Param('publicId') publicId: string, @Body() dto: SetTelegramEnabledDto) {
    return this.publicService.setTelegramEnabled(publicId, dto.enabled);
  }

  @Patch(':publicId/telegram/broadcasts')
  setTelegramBroadcasts(@Param('publicId') publicId: string, @Body() dto: SetTelegramEnabledDto) {
    return this.publicService.setTelegramBroadcasts(publicId, dto.enabled);
  }

  @Patch(':publicId/telegram/language')
  setTelegramLanguage(@Param('publicId') publicId: string, @Body() dto: SetTelegramLanguageDto) {
    return this.publicService.setTelegramLanguage(publicId, dto.language);
  }

  @Delete(':publicId/telegram')
  disconnectTelegram(@Param('publicId') publicId: string) {
    return this.publicService.disconnectTelegram(publicId);
  }
}
