import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { TransactionNotFoundException } from '@core/exceptions/transaction/transaction-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';

export interface UpdateFreeSpendingInput {
  coupleId: string;
  transactionId: string;
  is_free_spending: boolean;
}

export interface UpdateFreeSpendingOutput {
  id: string;
  is_free_spending: boolean;
  updated_at: Date;
}

/**
 * Update Free Spending Use Case
 *
 * Updates the is_free_spending flag of a transaction
 *
 * Business Rules:
 * - Transaction must exist and belong to the couple
 * - Only updates the is_free_spending flag
 */
@Injectable()
export class UpdateFreeSpendingUseCase
  implements IUseCase<UpdateFreeSpendingInput, UpdateFreeSpendingOutput>
{
  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    input: UpdateFreeSpendingInput,
  ): Promise<UpdateFreeSpendingOutput> {
    this.logger.logUseCase('UpdateFreeSpendingUseCase', {
      coupleId: input.coupleId,
      transactionId: input.transactionId,
      is_free_spending: input.is_free_spending,
    });

    // Find transaction
    const transaction = await this.transactionRepository.findById(
      input.transactionId,
    );

    if (!transaction || transaction.couple_id !== input.coupleId) {
      throw new TransactionNotFoundException(input.transactionId);
    }

    // Update is_free_spending
    const updatedTransaction = await this.transactionRepository.update(
      transaction.id,
      { is_free_spending: input.is_free_spending },
    );

    this.logger.log(
      `Transaction ${input.transactionId} free spending updated to ${input.is_free_spending}`,
    );

    return {
      id: updatedTransaction.id,
      is_free_spending: updatedTransaction.is_free_spending,
      updated_at: new Date(),
    };
  }
}
