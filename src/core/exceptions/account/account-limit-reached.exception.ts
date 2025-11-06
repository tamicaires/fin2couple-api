import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class AccountLimitReachedException extends BusinessException {
  constructor(limit: number) {
    super(
      `Account limit reached. Your plan allows a maximum of ${limit} accounts.`,
      ErrorCode.ACCOUNT_LIMIT_EXCEEDED,
      403,
    );
  }
}
