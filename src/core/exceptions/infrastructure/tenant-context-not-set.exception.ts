import { InfrastructureException } from '../base/infrastructure.exception';
import { ErrorCode } from '@core/enum/error-codes.enum';

export class TenantContextNotSetException extends InfrastructureException {
  constructor() {
    super(
      'Tenant context has not been set. This is a critical security issue.',
      ErrorCode.TENANT_CONTEXT_NOT_SET,
      500,
    );
  }
}
