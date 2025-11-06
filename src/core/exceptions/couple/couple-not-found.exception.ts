import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class CoupleNotFoundException extends BusinessException {
  constructor(identifier?: string) {
    const message = identifier
      ? `Couple with ID ${identifier} not found`
      : 'Couple not found';
    super(message, ErrorCode.COUPLE_NOT_FOUND, 404);
  }
}
