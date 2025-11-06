import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class InsufficientFreeSpendingException extends BusinessException {
  constructor(remaining: number) {
    super(
      'Insufficient free spending balance. Remaining: R$ ' + remaining.toFixed(2),
      ErrorCode.INSUFFICIENT_FREE_SPENDING,
      400,
    );
  }
}
