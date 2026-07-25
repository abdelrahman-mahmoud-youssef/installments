import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { Role } from '@prisma/client';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateOfferDto } from './dto/create-offer.dto';
import { OfferQueryDto } from './dto/offer-query.dto';
import { SetOffersVisibilityDto } from './dto/set-offers-visibility.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OffersService } from './offers.service';

@Controller('offers')
@Roles(Role.ADMIN)
export class OffersController {
  constructor(private readonly offersService: OffersService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: OfferQueryDto) {
    return this.offersService.findAll(user.tenantId, query);
  }

  @Post()
  @Audit('offer.create', 'Offer')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOfferDto) {
    return this.offersService.create(user.tenantId, dto);
  }

  @Patch('visibility')
  @Audit('offer.set_visibility', 'Tenant')
  setVisibility(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetOffersVisibilityDto) {
    return this.offersService.setPublicVisibility(user.tenantId, dto);
  }

  @Patch(':id')
  @Audit('offer.update', 'Offer')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateOfferDto) {
    return this.offersService.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Audit('offer.delete', 'Offer')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.offersService.remove(user.tenantId, id);
  }
}
