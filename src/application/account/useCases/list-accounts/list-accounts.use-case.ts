import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { LoggerService } from '@infra/logging/logger.service';
import { AccountType } from '@core/enum/account-type.enum';

export interface ListAccountsInput {
  coupleId: string;
}

export interface ListAccountsOutput {
  accounts: Array<{
    id: string;
    name: string;
    type: AccountType;
    balance: number;
    created_at: Date;
  }>;
  total_balance: number;
}

/**
 * List Accounts Use Case
 *
 * Returns all accounts for the couple with total balance
 *
 * Business Rules:
 * - Only returns accounts for the specified couple (tenant isolation)
 * - Calculates total balance across all accounts
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
    });

    // Get all accounts for couple
    const accounts = await this.accountRepository.findByCoupleId(input.coupleId);

    // Calculate total balance
    const total_balance = accounts.reduce((sum, account) => sum + account.balance, 0);

    return {
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        balance: account.balance,
        created_at: account.created_at,
      })),
      total_balance,
    };
  }
}
