import { ErrorCode } from '@core/enum/error-codes.enum';

export abstract class DomainException extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly timestamp: Date;

  constructor(message: string, code: ErrorCode, statusCode: number = 400) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date();
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
