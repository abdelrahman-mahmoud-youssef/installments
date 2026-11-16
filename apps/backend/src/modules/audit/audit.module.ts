import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { PushModule } from '../push/push.module';
import { AuditController } from './audit.controller';
import { AuditLogService } from './audit-log.service';

@Module({
  imports: [PushModule],
  controllers: [AuditController],
  providers: [AuditLogService, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
  exports: [AuditLogService],
})
export class AuditModule {}
