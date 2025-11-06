import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { IPlanRepository } from '@core/domain/repositories/plan.repository';
import { Couple } from '@core/domain/entities/couple.entity';
import { Subscription } from '@core/domain/entities/subscription.entity';
import { UserAlreadyInCoupleException } from '@core/exceptions/couple/user-already-in-couple.exception';
import { UnitOfWork } from '@infra/database/prisma/unit-of-work';
import { LoggerService } from '@infra/logging/logger.service';
import { SubscriptionStatus } from '@core/enum/subscription-status.enum';

export interface CreateCoupleInput {
  user_id_a: string;
  user_id_b: string;
  free_spending_a_monthly: number;
  free_spending_b_monthly: number;
  reset_day?: number;
}

export interface CreateCoupleOutput {
  couple: {
    id: string;
    user_id_a: string;
    user_id_b: string;
    free_spending_a_monthly: number;
    free_spending_b_monthly: number;
    reset_day: number;
    created_at: Date;
  };
  subscription: {
    id: string;
    plan_name: string;
    status: SubscriptionStatus;
    trial_days: number | null;
  };
}

/**
 * Create Couple Use Case
 *
 * Creates a couple (Tenant) and assigns a default FREE plan subscription
 *
 * Business Rules:
 * - Both users must NOT already be in a couple
 * - Creates couple + subscription in a single transaction (atomicity)
 * - Assigns FREE plan with 30-day trial by default
 * - Sets initial free spending remaining = monthly
 */
@Injectable()
export class CreateCoupleUseCase implements IUseCase<CreateCoupleInput, CreateCoupleOutput> {
  private readonly TRIAL_DAYS = 30;

  constructor(
    @Inject('ICoupleRepository')
    private readonly coupleRepository: ICoupleRepository,
    @Inject('IPlanRepository')
    private readonly planRepository: IPlanRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: CreateCoupleInput): Promise<CreateCoupleOutput> {
    this.logger.logUseCase('CreateCoupleUseCase', {
      user_id_a: input.user_id_a,
      user_id_b: input.user_id_b,
    });

    // Check if users are already in a couple
    const [userAExists, userBExists] = await Promise.all([
      this.coupleRepository.existsByUserId(input.user_id_a),
      this.coupleRepository.existsByUserId(input.user_id_b),
    ]);

    if (userAExists) {
      throw new UserAlreadyInCoupleException(input.user_id_a);
    }

    if (userBExists) {
      throw new UserAlreadyInCoupleException(input.user_id_b);
    }

    // Get FREE plan
    const freePlan = await this.planRepository.findFreePlan();
    if (!freePlan) {
      throw new Error('FREE plan not found in database. Run seed first.');
    }

    // Create couple and subscription in a transaction
    const result = await this.unitOfWork.execute(async (prisma) => {
      // Create couple with default CUSTOM financial model (fully configurable)
      const couple = new Couple({
        user_id_a: input.user_id_a,
        user_id_b: input.user_id_b,
        free_spending_a_monthly: input.free_spending_a_monthly,
        free_spending_b_monthly: input.free_spending_b_monthly,
        free_spending_a_remaining: input.free_spending_a_monthly, // Initial = monthly
        free_spending_b_remaining: input.free_spending_b_monthly,
        reset_day: input.reset_day || 1,
        financial_model: 'CUSTOM', // Default: fully configurable
        allow_personal_accounts: true,
        allow_private_transactions: true,
      });

      const createdCouple = await prisma.couple.create({
        data: {
          id: couple.id,
          user_id_a: couple.user_id_a,
          user_id_b: couple.user_id_b,
          free_spending_a_monthly: couple.free_spending_a_monthly,
          free_spending_b_monthly: couple.free_spending_b_monthly,
          free_spending_a_remaining: couple.free_spending_a_remaining,
          free_spending_b_remaining: couple.free_spending_b_remaining,
          reset_day: couple.reset_day,
          financial_model: couple.financial_model,
          allow_personal_accounts: couple.allow_personal_accounts,
          allow_private_transactions: couple.allow_private_transactions,
        },
      });

      // Create subscription (30-day trial)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + this.TRIAL_DAYS);

      const subscription = new Subscription({
        couple_id: createdCouple.id,
        plan_id: freePlan.id,
        status: SubscriptionStatus.TRIAL,
        end_date: endDate,
      });

      const createdSubscription = await prisma.subscription.create({
        data: {
          id: subscription.id,
          couple_id: subscription.couple_id,
          plan_id: subscription.plan_id,
          status: subscription.status,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
        },
      });

      return { couple: createdCouple, subscription: createdSubscription };
    });

    this.logger.log('Couple created successfully', {
      coupleId: result.couple.id,
      subscriptionId: result.subscription.id,
    });

    return {
      couple: {
        id: result.couple.id,
        user_id_a: result.couple.user_id_a,
        user_id_b: result.couple.user_id_b,
        free_spending_a_monthly: Number(result.couple.free_spending_a_monthly),
        free_spending_b_monthly: Number(result.couple.free_spending_b_monthly),
        reset_day: result.couple.reset_day,
        created_at: result.couple.created_at,
      },
      subscription: {
        id: result.subscription.id,
        plan_name: freePlan.name,
        status: result.subscription.status as SubscriptionStatus,
        trial_days: this.TRIAL_DAYS,
      },
    };
  }
}
