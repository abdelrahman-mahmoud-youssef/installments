import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { SubscriptionActivationService } from './billing/subscription-activation.service';
import { SubscriptionOffersController } from './billing/subscription-offers.controller';
import { SubscriptionOffersService } from './billing/subscription-offers.service';
import { SubscriptionPaymentsController } from './billing/subscription-payments.controller';
import { SubscriptionPaymentsService } from './billing/subscription-payments.service';
import { SubscriptionPlansController } from './billing/subscription-plans.controller';
import { SubscriptionPlansService } from './billing/subscription-plans.service';
import { PlatformAdminBootstrapService } from './platform-admin-bootstrap.service';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformAuthService } from './platform-auth.service';
import { PushModule } from '../push/push.module';
import { PlatformJwtStrategy } from './platform-jwt.strategy';
import { PlatformPushController } from './platform-push.controller';
import { PlatformSupportController } from './platform-support.controller';
import { PlatformSupportService } from './platform-support.service';
import { PlatformTenantsController } from './platform-tenants.controller';
import { PlatformTenantsService } from './platform-tenants.service';

@Module({
  imports: [
    PushModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: config.getOrThrow<string>('JWT_EXPIRES_IN'),
        } as JwtModuleOptions['signOptions'],
      }),
    }),
  ],
  controllers: [
    PlatformAuthController,
    PlatformTenantsController,
    PlatformSupportController,
    PlatformPushController,
    SubscriptionPlansController,
    SubscriptionOffersController,
    SubscriptionPaymentsController,
  ],
  providers: [
    PlatformAuthService,
    PlatformTenantsService,
    PlatformSupportService,
    PlatformJwtStrategy,
    PlatformAdminBootstrapService,
    SubscriptionActivationService,
    SubscriptionPlansService,
    SubscriptionOffersService,
    SubscriptionPaymentsService,
  ],
})
export class PlatformModule {}
