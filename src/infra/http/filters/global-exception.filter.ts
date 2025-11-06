import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nContext } from 'nestjs-i18n';
import { DomainException } from '@core/exceptions/base/domain.exception';
import { LoggerService } from '@infra/logging/logger.service';
import { Prisma } from '@prisma/client';

/**
 * Global Exception Filter
 *
 * Catches ALL exceptions and formats them with i18n messages
 *
 * Features:
 * - Translates DomainException messages to user's language
 * - Sanitizes error details in production
 * - Logs all errors
 * - Returns consistent error format
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const i18n = I18nContext.current(host);

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let translatedMessage = message;

    // Handle Domain Exceptions (our custom exceptions)
    if (exception instanceof DomainException) {
      status = exception.statusCode;
      code = exception.code;
      message = exception.message;

      // Try to translate the message
      // Exception message can be either:
      // 1. A translation key (e.g., 'account.limit_exceeded')
      // 2. A direct message (fallback)
      try {
        translatedMessage = i18n?.translate(message) || message;

        // If translation key not found, it returns the key itself
        // In this case, use the original message
        if (translatedMessage === message && message.includes('.')) {
          translatedMessage = message;
        }
      } catch {
        translatedMessage = message;
      }

      this.logger.error(`Domain Exception: ${code}`, exception.stack, {
        code,
        statusCode: status,
        userId: (request as any).user?.id,
        coupleId: (request as any).coupleId,
      });
    }
    // Handle Prisma Exceptions
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;

      // Map Prisma error codes to user-friendly messages
      switch (exception.code) {
        case 'P2002':
          code = 'DUPLICATE_ENTRY';
          message = 'This record already exists';
          translatedMessage = 'Este registro já existe';
          break;
        case 'P2025':
          code = 'NOT_FOUND';
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          translatedMessage = 'Registro não encontrado';
          break;
        case 'P2003':
          code = 'FOREIGN_KEY_VIOLATION';
          message = 'Cannot perform this operation due to existing relationships';
          translatedMessage = 'Não é possível realizar esta operação devido a relacionamentos existentes';
          break;
        default:
          code = 'DATABASE_ERROR';
          message = 'Database operation failed';
          translatedMessage = 'Erro na operação do banco de dados';
      }

      this.logger.error(`Prisma Exception: ${exception.code}`, exception.stack, {
        code: exception.code,
        meta: exception.meta,
      });
    }
    // Handle NestJS HTTP Exceptions
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();

      message = typeof exceptionResponse === 'string'
        ? exceptionResponse
        : exceptionResponse.message || 'Bad Request';

      code = exceptionResponse.code || `HTTP_${status}`;
      translatedMessage = message;

      this.logger.warn(`HTTP Exception: ${status}`, {
        message,
        statusCode: status,
      });
    }
    // Handle unexpected errors
    else {
      const error = exception as Error;
      message = error.message || 'Internal Server Error';

      this.logger.error('Unexpected Exception', error.stack, {
        message,
        type: error.constructor.name,
      });

      // Don't expose internal errors in production
      if (process.env.NODE_ENV === 'production') {
        translatedMessage = i18n?.translate('common.internal_server_error')
          || 'An unexpected error occurred';
      } else {
        translatedMessage = message;
      }
    }

    // Build error response
    const errorResponse: any = {
      statusCode: status,
      code,
      message: translatedMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Add stack trace in development
    if (process.env.NODE_ENV !== 'production' && exception instanceof Error) {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json(errorResponse);
  }
}
