import { Injectable, Inject } from '@nestjs/common';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { IUpdateTransactionStrategy } from './update-strategy.interface';

/**
 * Strategy: Update Single Transaction
 *
 * Updates only the specified transaction, regardless of whether it's
 * part of an installment group or recurring template.
 */
@Injectable()
export class UpdateSingleStrategy implements IUpdateTransactionStrategy {
  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(transactionId: string, updateData: Partial<Transaction>): Promise<Transaction[]> {
    // Simply update the single transaction
    const updated = await this.transactionRepository.update(transactionId, updateData);

    return [updated];
  }
}
