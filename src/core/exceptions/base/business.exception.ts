import { DomainException } from './domain.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export abstract class BusinessException extends DomainException {
  constructor(message: string, code: ErrorCode, statusCode: number = 422) {
    super(message, code, statusCode);
  }
}
