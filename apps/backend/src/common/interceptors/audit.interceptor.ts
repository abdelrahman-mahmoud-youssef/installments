import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import { AuditMetadata, AUDIT_KEY } from '../decorators/audit.decorator';
import { AuthenticatedUser } from '../decorators/current-user.decorator';
import { AuditLogService } from '../../modules/audit/audit-log.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogService: AuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const metadata = this.reflector.get<AuditMetadata | undefined>(AUDIT_KEY, context.getHandler());
    if (!metadata) {
      return next.handle();
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser; params: Record<string, string> }>();

    return next.handle().pipe(
      tap((response) => {
        const entityId = request.params.id ?? (response as { id?: string } | undefined)?.id ?? null;
        void this.auditLogService.record(
          request.user.tenantId,
          { id: request.user.userId, email: request.user.email },
          metadata.action,
          metadata.entityType,
          entityId,
        );
      }),
    );
  }
}
