import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { PrismaTenantService } from '@infra/database/prisma/prisma-tenant.service';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { UserNotInCoupleException } from '@core/exceptions/couple/user-not-in-couple.exception';
import { LoggerService } from '@infra/logging/logger.service';
import { Couple } from '@core/domain/entities/couple.entity';

/**
 * CRITICAL: Couple Guard (Multi-Tenant Isolation Guard)
 * 
 * This guard MUST be used on ALL routes that access couple/financial data
 * 
 * Responsibilities:
 * 1. Fetch couple_id for authenticated user
 * 2. Inject couple into request.couple
 * 3. Inject coupleId into request.coupleId  
 * 4. Set tenant context in PrismaTenantService
 * 5. Log security event if user has no couple
 * 
 * Usage:
 * @UseGuards(JwtAuthGuard, CoupleGuard)
 */
@Injectable()
export class CoupleGuard implements CanActivate {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: PrismaTenantService,
    private readonly logger: LoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      this.logger.logSecurityEvent('CoupleGuard: No user in request', 'high');
      return false;
    }

    // Find couple for this user
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ user_id_a: user.id }, { user_id_b: user.id }],
      },
    });

    if (!couple) {
      this.logger.logSecurityEvent(
        'CoupleGuard: User attempted to access couple data without being in a couple',
        'medium',
        { userId: user.id },
      );
      throw new UserNotInCoupleException();
    }

    // Convert Prisma model to domain entity
    const coupleEntity = new Couple({
      id: couple.id,
      user_id_a: couple.user_id_a,
      user_id_b: couple.user_id_b,
      free_spending_a_monthly: Number(couple.free_spending_a_monthly),
      free_spending_b_monthly: Number(couple.free_spending_b_monthly),
      free_spending_a_remaining: Number(couple.free_spending_a_remaining),
      free_spending_b_remaining: Number(couple.free_spending_b_remaining),
      reset_day: couple.reset_day,
      financial_model: couple.financial_model,
      allow_personal_accounts: couple.allow_personal_accounts,
      allow_private_transactions: couple.allow_private_transactions,
      created_at: couple.created_at,
      updated_at: couple.updated_at,
    });

    // Inject into request
    request.couple = coupleEntity;
    request.coupleId = couple.id;

    // SET TENANT CONTEXT (CRITICAL FOR MULTI-TENANCY)
    this.tenant.setTenantContext(couple.id, user.id);

    this.logger.debug('CoupleGuard: Tenant context set', {
      userId: user.id,
      coupleId: couple.id,
    });

    return true;
  }
}
