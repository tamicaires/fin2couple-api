import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class UserAlreadyExistsException extends BusinessException {
  constructor(email: string) {
    super(`User with email ${email} already exists`, ErrorCode.USER_ALREADY_EXISTS, 409);
  }
}
