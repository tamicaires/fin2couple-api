import { Transaction } from '@core/domain/entities/transaction.entity';

/**
 * Strategy Pattern Interface
 *
 * Defines the contract for different update strategies based on scope
 */
export interface IUpdateTransactionStrategy {
  /**
   * Execute the update strategy
   * @param transactionId - ID of the transaction being updated
   * @param updateData - Partial data to update
   * @returns Array of updated transactions
   */
  execute(transactionId: string, updateData: Partial<Transaction>): Promise<Transaction[]>;
}
