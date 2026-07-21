import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditInterceptor } from '../../common/interceptors/audit.interceptor';
import { AuditController } from './audit.controller';
import { AuditLogService } from './audit-log.service';

@Module({
  controllers: [AuditController],
  providers: [AuditLogService, { provide: APP_INTERCEPTOR, useClass: AuditInterceptor }],
  exports: [AuditLogService],
})
export class AuditModule {}
