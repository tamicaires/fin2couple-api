import { BusinessException } from '../base/business.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class PlanLimitExceededException extends BusinessException {
  constructor(resource: string, limit: number) {
    super(
      `${resource} limit exceeded. Maximum allowed: ${limit}. Please upgrade your plan.`,
      ErrorCode.PLAN_LIMIT_EXCEEDED,
      403,
    );
  }
}
