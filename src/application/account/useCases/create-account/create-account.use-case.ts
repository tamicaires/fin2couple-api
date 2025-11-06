import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { ISubscriptionRepository } from '@core/domain/repositories/subscription.repository';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { Account } from '@core/domain/entities/account.entity';
// import { AccountLimitReachedException } from '@core/exceptions/account/account-limit-reached.exception';
import { SubscriptionInactiveException } from '@core/exceptions/subscription/subscription-inactive.exception';
import { LoggerService } from '@infra/logging/logger.service';
import { AccountType } from '@core/enum/account-type.enum';

export interface CreateAccountInput {
  coupleId: string;
  name: string;
  type: AccountType;
  initial_balance?: number;
  owner_id?: string | null; // null = joint account, string = personal account
}

export interface CreateAccountOutput {
  id: string;
  couple_id: string;
  name: string;
  type: AccountType;
  balance: number;
  created_at: Date;
}

/**
 * Create Account Use Case
 *
 * Creates a financial account for the couple
 *
 * Business Rules:
 * - Couple must have an active subscription
 * - FREE plan: max 2 accounts
 * - PREMIUM plan: unlimited accounts
 * - Initial balance defaults to 0
 */
@Injectable()
export class CreateAccountUseCase implements IUseCase<CreateAccountInput, CreateAccountOutput> {
  // private readonly FREE_PLAN_ACCOUNT_LIMIT = 2;

  constructor(
    @Inject('IAccountRepository')
    private readonly accountRepository: IAccountRepository,
    @Inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject('ICoupleRepository')
    private readonly coupleRepository: ICoupleRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: CreateAccountInput): Promise<CreateAccountOutput> {
    this.logger.logUseCase('CreateAccountUseCase', {
      coupleId: input.coupleId,
      name: input.name,
      type: input.type,
      owner_id: input.owner_id,
    });

    // Check subscription status
    const subscription = await this.subscriptionRepository.findActiveByCoupleId(input.coupleId);
    if (!subscription) {
      throw new SubscriptionInactiveException();
    }

    // Get couple to check financial model settings
    const couple = await this.coupleRepository.findById(input.coupleId);
    if (!couple) {
      throw new Error('Couple not found');
    }

    // FINANCIAL MODEL GUARD: Validate if personal accounts are allowed
    if (input.owner_id && !couple.allow_personal_accounts) {
      throw new ForbiddenException(
        'Contas pessoais não estão habilitadas para este casal. ' +
        'Altere o modelo financeiro em Configurações para permitir contas pessoais.',
      );
    }

    // Get plan details (not used for now - all plans are premium)
    // const plan = await this.planRepository.findById(subscription.plan_id);

    // Check account limit (FREE plan only) - DISABLED FOR PREMIUM
    // if (plan && plan.isFree()) {
    //   const existingAccounts = await this.accountRepository.findByCoupleId(input.coupleId);
    //   if (existingAccounts.length >= this.FREE_PLAN_ACCOUNT_LIMIT) {
    //     throw new AccountLimitReachedException(this.FREE_PLAN_ACCOUNT_LIMIT);
    //   }
    // }

    // Create account
    const account = new Account({
      couple_id: input.coupleId,
      name: input.name,
      type: input.type,
      current_balance: input.initial_balance || 0,
      owner_id: input.owner_id ?? null, // null = joint account
    });

    const created = await this.accountRepository.create(account);

    this.logger.log('Account created successfully', {
      accountId: created.id,
      coupleId: input.coupleId,
      type: input.type,
    });

    return {
      id: created.id,
      couple_id: created.couple_id,
      name: created.name,
      type: created.type,
      balance: created.balance,
      created_at: created.created_at,
    };
  }
}
