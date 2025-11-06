import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class SubscriptionExpiredException extends BusinessException {
  constructor() {
    super(
      'Your subscription has expired. Please renew to continue using the service.',
      ErrorCode.SUBSCRIPTION_EXPIRED,
      403,
    );
  }
}
