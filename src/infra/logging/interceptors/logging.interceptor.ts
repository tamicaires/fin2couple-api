import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger.service';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const start = Date.now();

    const { method, url, body } = request;
    const userId = (request as any).user?.id;
    const coupleId = (request as any).coupleId;

    return next.handle().pipe(
      tap({
        next: (): void => {
          const duration = Date.now() - start;
          const { statusCode } = response;

          this.logger.logRequest(method, url, statusCode, duration, {
            userId,
            coupleId,
            body: this.sanitizeBody(body),
          });

          // Alert on high latency
          if (duration > 500) {
            this.logger.warn(`High latency detected: ${duration}ms`, {
              method,
              url,
              userId,
              coupleId,
            });
          }
        },
        error: (error): void => {
          const duration = Date.now() - start;
          this.logger.error(`Request failed: ${error.message}`, error.stack, {
            method,
            url,
            duration,
            userId,
            coupleId,
          });
        },
      }),
    );
  }

  private sanitizeBody(body: any): any {
    if (!body) return undefined;

    const sanitized = { ...body };
    // Remove sensitive fields
    delete sanitized.password;
    delete sanitized.password_hash;
    delete sanitized.token;

    return sanitized;
  }
}
