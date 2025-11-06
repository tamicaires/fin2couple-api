import { Injectable, Inject } from '@nestjs/common';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { IRecurringTransactionTemplateRepository } from '@core/domain/repositories/recurring-transaction-template.repository';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { TransactionUpdateScope } from '@core/enum/transaction-update-scope.enum';
import { IUpdateTransactionStrategy } from './strategies/update-strategy.interface';
import { UpdateSingleStrategy } from './strategies/update-single.strategy';
import { UpdateInstallmentFutureStrategy } from './strategies/update-installment-future.strategy';
import { UpdateInstallmentAllStrategy } from './strategies/update-installment-all.strategy';
import { UpdateRecurringFutureStrategy } from './strategies/update-recurring-future.strategy';

export interface UpdateTransactionInput {
  transaction_id: string;
  update_scope: TransactionUpdateScope;
  update_data: Partial<Transaction>;
}

export interface UpdateTransactionOutput {
  updated_transactions: Transaction[];
  scope_applied: TransactionUpdateScope;
}

/**
 * Use Case: Update Transaction with Scope
 *
 * Updates transaction(s) based on the specified scope.
 * Uses Strategy Pattern to handle different update behaviors.
 *
 * Design Pattern: Strategy Pattern
 * - Different strategies for different update scopes
 * - Context (this use case) delegates to appropriate strategy
 *
 * Scopes:
 * - THIS_ONLY: Updates only the specified transaction
 * - THIS_AND_FUTURE: Updates current and future installments/template
 * - ALL: Updates all related transactions
 */
@Injectable()
export class UpdateTransactionUseCase {
  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('IRecurringTransactionTemplateRepository')
    private readonly templateRepository: IRecurringTransactionTemplateRepository,
  ) {}

  async execute(input: UpdateTransactionInput): Promise<UpdateTransactionOutput> {
    // Get the transaction to determine its type
    const transaction = await this.transactionRepository.findById(input.transaction_id);

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // Select appropriate strategy
    const strategy = await this.selectStrategy(transaction, input.update_scope);

    // Execute the strategy
    const updatedTransactions = await strategy.execute(input.transaction_id, input.update_data);

    return {
      updated_transactions: updatedTransactions,
      scope_applied: input.update_scope,
    };
  }

  /**
   * Strategy Selection Logic
   * Selects the appropriate update strategy based on transaction type and scope
   */
  private async selectStrategy(
    transaction: Transaction,
    scope: TransactionUpdateScope,
  ): Promise<IUpdateTransactionStrategy> {
    // For THIS_ONLY scope, always use single strategy regardless of type
    if (scope === TransactionUpdateScope.THIS_ONLY) {
      return new UpdateSingleStrategy(this.transactionRepository);
    }

    // For installment transactions
    if (transaction.isInstallment()) {
      if (scope === TransactionUpdateScope.THIS_AND_FUTURE) {
        return new UpdateInstallmentFutureStrategy(this.transactionRepository);
      }
      if (scope === TransactionUpdateScope.ALL) {
        return new UpdateInstallmentAllStrategy(this.transactionRepository);
      }
    }

    // For recurring transactions
    if (transaction.isRecurring()) {
      if (scope === TransactionUpdateScope.THIS_AND_FUTURE) {
        return new UpdateRecurringFutureStrategy(this.transactionRepository, this.templateRepository);
      }
      // Note: ALL scope for recurring doesn't make sense since we can't update past transactions
      // Fall back to THIS_ONLY
      return new UpdateSingleStrategy(this.transactionRepository);
    }

    // For regular transactions (not installment or recurring)
    // Any scope just updates the single transaction
    return new UpdateSingleStrategy(this.transactionRepository);
  }
}
