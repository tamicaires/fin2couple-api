import { Injectable, Inject } from '@nestjs/common';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { IUpdateTransactionStrategy } from './update-strategy.interface';

/**
 * Strategy: Update All Installments
 *
 * Updates all installments in the group, including past ones.
 */
@Injectable()
export class UpdateInstallmentAllStrategy implements IUpdateTransactionStrategy {
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

    const { installment_group_id } = currentTransaction;

    if (!installment_group_id) {
      throw new Error('Installment group ID not found');
    }

    // Get ALL installments in the group
    const allInstallments = await this.transactionRepository.findByInstallmentGroup(
      currentTransaction.couple_id,
      installment_group_id,
    );

    // Extract IDs
    const installmentIds = allInstallments.map((t) => t.id);

    // Update all installments in batch
    await this.transactionRepository.updateBatch(installmentIds, updateData);

    // Fetch and return all updated transactions
    return await this.transactionRepository.findByInstallmentGroup(
      currentTransaction.couple_id,
      installment_group_id,
    );
  }
}
