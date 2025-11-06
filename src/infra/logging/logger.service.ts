import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

export interface LogContext {
  userId?: string;
  coupleId?: string;
  useCase?: string;
  method?: string;
  url?: string;
  duration?: number;
  [key: string]: unknown;
}

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    this.logger = winston.createLogger({
      level: isProduction ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'finduo-api' },
      transports: [
        // Error logs
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          maxsize: 5242880, // 5MB
          maxFiles: 5,
        }),
        // Combined logs
        new winston.transports.File({
          filename: 'logs/combined.log',
          maxsize: 5242880, // 5MB
          maxFiles: 10,
        }),
      ],
    });

    // Console in development
    if (!isProduction) {
      this.logger.add(
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      );
    }
  }

  log(message: string, context?: LogContext): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: LogContext): void {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: LogContext): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: LogContext): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: LogContext): void {
    this.logger.verbose(message, { context });
  }

  // HTTP Request logging
  logRequest(method: string, url: string, statusCode: number, duration: number, context?: LogContext): void {
    this.logger.info('HTTP Request', {
      type: 'HTTP_REQUEST',
      method,
      url,
      statusCode,
      duration,
      ...context,
    });
  }

  // Use Case execution logging
  logUseCase(useCaseName: string, input: unknown, context?: LogContext): void {
    this.logger.info('Use Case Execution', {
      type: 'USE_CASE',
      useCase: useCaseName,
      input,
      ...context,
    });
  }

  // Database query logging
  logQuery(model: string, action: string, duration: number, context?: LogContext): void {
    if (duration > 100) {
      this.logger.warn('Slow Query Detected', {
        type: 'SLOW_QUERY',
        model,
        action,
        duration,
        ...context,
      });
    } else {
      this.logger.debug('Database Query', {
        type: 'DB_QUERY',
        model,
        action,
        duration,
        ...context,
      });
    }
  }

  // Security events
  logSecurityEvent(event: string, severity: 'low' | 'medium' | 'high', context?: LogContext): void {
    this.logger.warn('Security Event', {
      type: 'SECURITY',
      event,
      severity,
      ...context,
    });
  }
}
