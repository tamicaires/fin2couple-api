import { DomainException } from './domain.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export abstract class InfrastructureException extends DomainException {
  constructor(message: string, code: ErrorCode, statusCode: number = 500) {
    super(message, code, statusCode);
  }
}
