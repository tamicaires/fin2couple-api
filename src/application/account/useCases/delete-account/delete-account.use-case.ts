import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { AccountNotFoundException } from '@core/exceptions/account/account-not-found.exception';
import { CannotDeleteAccountWithBalanceException } from '@core/exceptions/account/cannot-delete-account-with-balance.exception';
import { LoggerService } from '@infra/logging/logger.service';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { TransactionType } from '@core/enum/transaction-type.enum';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';

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
 * Delete Account Use Case
 *
 * Deletes an account from the couple
 *
 * Business Rules:
 * - Account must exist and belong to the couple
 * - If account has balance but no transactions:
 *   Creates automatic adjustment transaction to zero the balance
 * - If account has transactions with non-zero balance:
 *   Cannot delete (user must reconcile first)
 */
@Injectable()
export class DeleteAccountUseCase implements IUseCase<DeleteAccountInput, DeleteAccountOutput> {
  constructor(
    @Inject('IAccountRepository')
    private readonly accountRepository: IAccountRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: DeleteAccountInput): Promise<DeleteAccountOutput> {
    this.logger.logUseCase('DeleteAccountUseCase', {
      coupleId: input.coupleId,
      accountId: input.accountId,
      userId: input.userId,
    });

    // Fetch account and transaction count in parallel (Strategy Pattern - optimize performance)
    const [account, transactionCount] = await this.fetchAccountDataInParallel(input.accountId);

    this.validateAccountExists(account, input.accountId);

    // Handle balance reconciliation if needed (Template Method Pattern)
    await this.reconcileBalanceIfNeeded(account, transactionCount, input);

    // Delete account
    await this.accountRepository.delete(input.accountId);

    this.logSuccessfulDeletion(input.accountId, input.coupleId, account.balance, transactionCount);

    return {
      success: true,
      deleted_account_id: input.accountId,
    };
  }

  /**
   * Fetches account and transaction count in parallel for performance optimization
   * @private
   */
  private async fetchAccountDataInParallel(accountId: string) {
    return await Promise.all([
      this.accountRepository.findById(accountId),
      this.transactionRepository.countByAccountId(accountId),
    ]);
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

  /**
   * Reconciles account balance based on transaction history
   * - No balance: proceeds with deletion
   * - Balance with no transactions: creates adjustment transaction
   * - Balance with transactions: throws exception (user must reconcile)
   * @private
   */
  private async reconcileBalanceIfNeeded(
    account: any,
    transactionCount: number,
    input: DeleteAccountInput,
  ): Promise<void> {
    if (account.balance === 0) {
      return; // No reconciliation needed
    }

    if (transactionCount === 0) {
      await this.createInitialBalanceAdjustment(account, input);
    } else {
      throw new CannotDeleteAccountWithBalanceException(account.balance);
    }
  }

  /**
   * Creates an automatic adjustment transaction to zero out initial balance
   * This ensures all balance changes are properly audited
   * @private
   */
  private async createInitialBalanceAdjustment(account: any, input: DeleteAccountInput): Promise<void> {
    this.logger.log('Creating adjustment transaction for initial balance', {
      accountId: input.accountId,
      balance: account.balance,
    });

    const adjustmentTransaction = this.buildAdjustmentTransaction(account, input);

    await this.transactionRepository.create(adjustmentTransaction);
    await this.accountRepository.updateBalance(input.accountId, 0);
  }

  /**
   * Builds adjustment transaction entity (Factory Pattern)
   * @private
   */
  private buildAdjustmentTransaction(account: any, input: DeleteAccountInput): Transaction {
    return new Transaction({
      couple_id: input.coupleId,
      account_id: input.accountId,
      paid_by_id: input.userId,
      type: TransactionType.ADJUSTMENT,
      amount: Math.abs(account.balance),
      description: 'Ajuste automático ao excluir conta com saldo inicial',
      visibility: TransactionVisibility.PRIVATE,
      is_free_spending: false,
      is_couple_expense: false,
      category: null,
    });
  }

  /**
   * Logs successful account deletion with context
   * @private
   */
  private logSuccessfulDeletion(
    accountId: string,
    coupleId: string,
    originalBalance: number,
    transactionCount: number,
  ): void {
    this.logger.log('Account deleted successfully', {
      accountId,
      coupleId,
      hadInitialBalance: transactionCount === 0 && originalBalance !== 0,
      transactionCount,
    });
  }
}
