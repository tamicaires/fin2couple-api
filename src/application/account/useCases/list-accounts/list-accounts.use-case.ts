import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { LoggerService } from '@infra/logging/logger.service';
import { AccountType } from '@core/enum/account-type.enum';

export interface ListAccountsInput {
  coupleId: string;
  userId: string;
}

export interface ListAccountsOutput {
  accounts: Array<{
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    is_joint: boolean;
    owner_id: string | null;
    created_at: Date;
  }>;
  total_balance: number;
}

/**
 * List Accounts Use Case
 *
 * Returns accounts visible to the user with total balance
 *
 * Business Rules:
 * - Only returns accounts for the specified couple (tenant isolation)
 * - Returns joint accounts (owner_id = null) - visible to both partners
 * - Returns user's personal accounts (owner_id = userId) - visible only to owner
 * - Calculates total balance across visible accounts only
 * - Ordered by creation date (newest first)
 */
@Injectable()
export class ListAccountsUseCase implements IUseCase<ListAccountsInput, ListAccountsOutput> {
  constructor(
    @Inject('IAccountRepository')

    private readonly accountRepository: IAccountRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: ListAccountsInput): Promise<ListAccountsOutput> {
    this.logger.logUseCase('ListAccountsUseCase', {
      coupleId: input.coupleId,
      userId: input.userId,
    });

    // Get visible accounts for user (optimized query)
    // Returns: joint accounts + user's personal accounts
    const visibleAccounts = await this.accountRepository.findVisibleAccounts(
      input.coupleId,
      input.userId,
    );

    // Calculate total balance (only from visible accounts)
    const total_balance = visibleAccounts.reduce((sum, account) => sum + account.balance, 0);

    return {
      accounts: visibleAccounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        is_joint: account.isJointAccount(),
        owner_id: account.owner_id,
        created_at: account.created_at,
      })),
      total_balance,
    };
  }
}
