import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class UserAlreadyInCoupleException extends BusinessException {
  constructor(userId: string) {
    super(`User ${userId} is already part of a couple`, ErrorCode.USER_ALREADY_IN_COUPLE, 409);
  }
}
