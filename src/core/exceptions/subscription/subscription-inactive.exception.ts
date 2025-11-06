import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class SubscriptionInactiveException extends BusinessException {
  constructor() {
    super(
      'No active subscription found. Please subscribe to a plan to continue.',
      ErrorCode.SUBSCRIPTION_EXPIRED,
      403,
    );
  }
}
