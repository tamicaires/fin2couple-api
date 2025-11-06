import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class UserNotInCoupleException extends BusinessException {
  constructor() {
    super('User is not part of any couple', ErrorCode.USER_NOT_IN_COUPLE, 403);
  }
}
