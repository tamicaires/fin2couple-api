import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class AccountLimitExceededException extends BusinessException {
  constructor(maxAccounts: number) {
    super(
      `Account limit exceeded. Maximum allowed: ${maxAccounts}. Please upgrade your plan.`,
      ErrorCode.ACCOUNT_LIMIT_EXCEEDED,
      403,
    );
  }
}
