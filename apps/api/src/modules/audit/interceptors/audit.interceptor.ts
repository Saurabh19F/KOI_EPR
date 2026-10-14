import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AuditService } from '../audit.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, ip, headers } = request;

    // Skip audit for GET requests and health checks
    if (method === 'GET' || url.includes('health')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (response) => {
        try {
          const entityType = this.extractEntityType(url);
          const recordId = response?.id || response?.userId || response?.quoteId || response?.enquiryOrderId || this.extractEntityId(url);

          await this.auditService.log(
            user?.companyId || 'default',
            entityType,
            recordId,
            method === 'POST' ? 'create' : 'update',
            user?.userId || 'system',
            {
              newValue: body,
              ipAddress: ip,
              userAgent: headers['user-agent'],
            },
          );
        } catch (error) {
          console.error('Audit logging failed:', error);
        }
      }),
    );
  }

  private extractEntityType(url: string): string {
    const parts = url.split('/').filter(Boolean);
    return parts[2] || 'unknown';
  }

  private extractEntityId(url: string): string | undefined {
    const parts = url.split('/').filter(Boolean);
    return parts[3];
  }
}
