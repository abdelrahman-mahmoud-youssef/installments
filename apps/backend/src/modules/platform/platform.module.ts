import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PlatformAdminBootstrapService } from './platform-admin-bootstrap.service';
import { PlatformAuthController } from './platform-auth.controller';
import { PlatformAuthService } from './platform-auth.service';
import { PlatformJwtStrategy } from './platform-jwt.strategy';
import { PlatformTenantsController } from './platform-tenants.controller';
import { PlatformTenantsService } from './platform-tenants.service';

@Module({
  imports: [
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
  controllers: [PlatformAuthController, PlatformTenantsController],
  providers: [PlatformAuthService, PlatformTenantsService, PlatformJwtStrategy, PlatformAdminBootstrapService],
})
export class PlatformModule {}
