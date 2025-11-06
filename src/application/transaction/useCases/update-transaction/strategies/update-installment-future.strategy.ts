import { Injectable, Inject } from '@nestjs/common';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { IUpdateTransactionStrategy } from './update-strategy.interface';

/**
 * Strategy: Update Current and Future Installments
 *
 * Updates the current installment and all future installments in the group.
 * Past installments remain unchanged.
 */
@Injectable()
export class UpdateInstallmentFutureStrategy implements IUpdateTransactionStrategy {
  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(transactionId: string, updateData: Partial<Transaction>): Promise<Transaction[]> {
    // Get the current transaction to find installment info
    const currentTransaction = await this.transactionRepository.findById(transactionId);

    if (!currentTransaction) {
      throw new Error('Transaction not found');
    }

    if (!currentTransaction.isInstallment()) {
      throw new Error('Transaction is not part of an installment group');
    }

    const { installment_group_id, transaction_date } = currentTransaction;

    if (!installment_group_id) {
      throw new Error('Installment group ID not found');
    }

    // Get all future installments (including current)
    const futureInstallments = await this.transactionRepository.findFutureInstallments(
      currentTransaction.couple_id,
      installment_group_id,
      transaction_date,
    );

    // Extract IDs
    const installmentIds = futureInstallments.map((t) => t.id);

    // Update all future installments in batch
    await this.transactionRepository.updateBatch(installmentIds, updateData);

    // Fetch and return all updated transactions
    const updatedInstallments = await this.transactionRepository.findByInstallmentGroup(
      currentTransaction.couple_id,
      installment_group_id,
    );

    return updatedInstallments.filter((t) => installmentIds.includes(t.id));
  }
}
