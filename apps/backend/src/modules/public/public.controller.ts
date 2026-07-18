import { Controller, Get, Param } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { PublicService } from './public.service';

@Controller('public/customers')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Public()
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @Get(':publicId')
  getCustomer(@Param('publicId') publicId: string) {
    return this.publicService.getCustomerByPublicId(publicId);
  }
}
