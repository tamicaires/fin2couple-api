import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { CoupleNotFoundException } from '@core/exceptions/couple/couple-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';

export interface GetCoupleDashboardInput {
  coupleId: string;
  userId: string; // To get individual stats
}

export interface GetCoupleDashboardOutput {
  // Couple info
  couple: {
    id: string;
    reset_day: number;
    financial_model: string;
    allow_personal_accounts: boolean;
    allow_private_transactions: boolean;
  };

  // Financial overview
  total_balance: number;
  monthly_income: number;
  monthly_expenses: number;
  couple_expenses: number;

  // Free Spending (Individual)
  free_spending: {
    user_a: {
      monthly: number;
      remaining: number;
      used: number;
      percentage_used: number;
    };
    user_b: {
      monthly: number;
      remaining: number;
      used: number;
      percentage_used: number;
    };
    current_user_is_a: boolean;
  };
}

/**
 * Get Couple Dashboard Use Case
 *
 * Returns comprehensive financial overview for the couple
 *
 * Business Rules:
 * - Shows total balance across all accounts
 * - Shows monthly stats (current month)
 * - Shows individual free spending for both partners
 * - Calculates percentage used of free spending
 */
@Injectable()
export class GetCoupleDashboardUseCase
  implements IUseCase<GetCoupleDashboardInput, GetCoupleDashboardOutput>
{
  constructor(
    @Inject('ICoupleRepository')

    private readonly coupleRepository: ICoupleRepository,
    @Inject('IAccountRepository')

    private readonly accountRepository: IAccountRepository,
    @Inject('ITransactionRepository')

    private readonly transactionRepository: ITransactionRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: GetCoupleDashboardInput): Promise<GetCoupleDashboardOutput> {
    this.logger.logUseCase('GetCoupleDashboardUseCase', {
      coupleId: input.coupleId,
      userId: input.userId,
    });

    // Get couple data
    const couple = await this.coupleRepository.findById(input.coupleId);
    if (!couple) {
      throw new CoupleNotFoundException(input.coupleId);
    }

    // Get current month stats
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    // Parallel queries for performance (only visible accounts/transactions)
    const [totalBalance, monthlyStats] = await Promise.all([
      this.accountRepository.getTotalBalanceVisible(input.coupleId, input.userId),
      this.transactionRepository.getMonthlyStatsVisible(input.coupleId, input.userId, year, month),
    ]);

    // Calculate free spending stats
    const freeSpendingA = {
      monthly: couple.free_spending_a_monthly,
      remaining: couple.free_spending_a_remaining,
      used: couple.free_spending_a_monthly - couple.free_spending_a_remaining,
      percentage_used:
        couple.free_spending_a_monthly > 0
          ? ((couple.free_spending_a_monthly - couple.free_spending_a_remaining) /
              couple.free_spending_a_monthly) *
            100
          : 0,
    };

    const freeSpendingB = {
      monthly: couple.free_spending_b_monthly,
      remaining: couple.free_spending_b_remaining,
      used: couple.free_spending_b_monthly - couple.free_spending_b_remaining,
      percentage_used:
        couple.free_spending_b_monthly > 0
          ? ((couple.free_spending_b_monthly - couple.free_spending_b_remaining) /
              couple.free_spending_b_monthly) *
            100
          : 0,
    };

    return {
      couple: {
        id: couple.id,
        reset_day: couple.reset_day,
        financial_model: couple.financial_model,
        allow_personal_accounts: couple.allow_personal_accounts,
        allow_private_transactions: couple.allow_private_transactions,
      },
      total_balance: totalBalance,
      monthly_income: monthlyStats.totalIncome,
      monthly_expenses: monthlyStats.totalExpenses,
      couple_expenses: monthlyStats.coupleExpenses,
      free_spending: {
        user_a: freeSpendingA,
        user_b: freeSpendingB,
        current_user_is_a: couple.isUserA(input.userId),
      },
    };
  }
}
