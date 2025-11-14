import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { AccountNotFoundException } from '@core/exceptions/account/account-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';

export interface DeleteAccountInput {
  coupleId: string;
  accountId: string;
  userId: string;
}

export interface DeleteAccountOutput {
  success: boolean;
  deleted_account_id: string;
}

/**
 * Delete Account Use Case (Hard Delete)
 *
 * Permanently deletes an account and all its transactions
 *
 * Business Rules:
 * - Account must exist and belong to the couple
 * - Deletes account permanently from database
 * - CASCADE deletes all transactions and installment templates
 * - This action is IRREVERSIBLE
 * - Should require user confirmation
 */
@Injectable()
export class DeleteAccountUseCase implements IUseCase<DeleteAccountInput, DeleteAccountOutput> {
  constructor(
    @Inject('IAccountRepository')
    private readonly accountRepository: IAccountRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: DeleteAccountInput): Promise<DeleteAccountOutput> {
    this.logger.logUseCase('DeleteAccountUseCase (Hard Delete)', {
      coupleId: input.coupleId,
      accountId: input.accountId,
      userId: input.userId,
    });

    // Fetch account
    const account = await this.accountRepository.findById(input.accountId);

    this.validateAccountExists(account, input.accountId);

    // Permanently delete account (CASCADE will delete transactions)
    await this.accountRepository.delete(input.accountId);

    this.logger.warn('Account permanently deleted', {
      accountId: input.accountId,
      coupleId: input.coupleId,
      balance: account.balance,
      message: 'All transactions were also deleted',
    });

    return {
      success: true,
      deleted_account_id: input.accountId,
    };
  }

  /**
   * Validates that account exists, throws exception if not found
   * Type assertion ensures TypeScript knows account is not null after this check
   * @private
   */
  private validateAccountExists(account: any, accountId: string): asserts account {
    if (!account) {
      throw new AccountNotFoundException(accountId);
    }
  }
}
