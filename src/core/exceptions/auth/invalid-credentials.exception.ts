import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class InvalidCredentialsException extends BusinessException {
  constructor() {
    super('Invalid email or password', ErrorCode.INVALID_CREDENTIALS, 401);
  }
}
