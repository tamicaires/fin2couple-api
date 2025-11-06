import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class CannotDeleteAccountWithBalanceException extends BusinessException {
  constructor(balance: number) {
    super(
      `Cannot delete account with non-zero balance. Current balance: R$ ${balance.toFixed(2)}`,
      ErrorCode.CANNOT_DELETE_ACCOUNT_WITH_BALANCE,
      400,
    );
  }
}
