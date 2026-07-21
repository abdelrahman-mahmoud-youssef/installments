import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { Audit } from '../../common/decorators/audit.decorator';
import { AuthenticatedUser, CurrentUser } from '../../common/decorators/current-user.decorator';
import { DeclineClaimDto } from './dto/decline-claim.dto';
import { PaymentClaimQueryDto } from './dto/payment-claim-query.dto';
import { PaymentClaimsService } from './payment-claims.service';

@Controller('payment-claims')
export class PaymentClaimsController {
  constructor(private readonly paymentClaimsService: PaymentClaimsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: PaymentClaimQueryDto) {
    return this.paymentClaimsService.findAll(user.tenantId, query);
  }

  @Patch(':id/approve')
  @Audit('paymentClaim.approve', 'PaymentClaim')
  approve(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.paymentClaimsService.approve(user.tenantId, user.userId, id);
  }

  @Patch(':id/decline')
  @Audit('paymentClaim.decline', 'PaymentClaim')
  decline(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: DeclineClaimDto,
  ) {
    return this.paymentClaimsService.decline(user.tenantId, user.userId, id, dto);
  }
}
