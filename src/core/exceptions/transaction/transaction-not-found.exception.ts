import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class TransactionNotFoundException extends BusinessException {
  constructor(transactionId: string) {
    super(
      'Transaction not found: ' + transactionId,
      ErrorCode.TRANSACTION_NOT_FOUND,
      404,
    );
  }
}
