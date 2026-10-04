import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  ForbiddenException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformAuditLog } from '../../modules/platform/entities/platform-audit-log.entity';
import { LoginHistory } from '../../modules/platform/entities/login-history.entity';
import { SecurityEvent } from '../../modules/platform/entities/security-event.entity';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    @InjectRepository(PlatformAuditLog)
    private auditLogRepository: Repository<PlatformAuditLog>,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user } = request;

    // Capture the original handler
    const handler = context.getHandler();
    const controller = context.getClass();

    // Execute the handler
    const result = await next.handle().toPromise().catch((error) => {
      // Log failed operations
      this.logAuditEvent({
        companyId: user?.companyId,
        userId: user?.id,
        userEmail: user?.email,
        action: `${method}_FAILED`,
        entityType: controller.name,
        entityId: body?.id || request.params?.id,
        module: controller.name,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        requestId: request.headers['x-request-id'],
        description: `API call failed: ${url}`,
        metadata: JSON.stringify({ error: error?.message, body }),
      });
      throw error;
    });

    // Log successful operations (only for mutations)
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      this.logAuditEvent({
        companyId: user?.companyId,
        userId: user?.id,
        userEmail: user?.email,
        action: method,
        entityType: controller.name,
        entityId: request.params?.id,
        module: controller.name,
        ipAddress: request.ip,
        userAgent: request.headers['user-agent'],
        requestId: request.headers['x-request-id'],
        description: `API call: ${method} ${url}`,
        metadata: JSON.stringify({ body }),
      });
    }

    return result;
  }

  private async logAuditEvent(data: Partial<PlatformAuditLog>): Promise<void> {
    try {
      await this.auditLogRepository.save(this.auditLogRepository.create(data));
    } catch (error) {
      // Silent fail - don't break the request
      console.error('Failed to log audit event:', error);
    }
  }
}
