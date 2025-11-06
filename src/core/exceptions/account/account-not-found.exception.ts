import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class AccountNotFoundException extends BusinessException {
  constructor(accountId: string) {
    super(`Account with ID ${accountId} not found`, ErrorCode.ACCOUNT_NOT_FOUND, 404);
  }
}
