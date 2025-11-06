import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { TransactionNotFoundException } from '@core/exceptions/transaction/transaction-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';
import { UnitOfWork } from '@infra/database/prisma/unit-of-work';
import { TransactionType } from '@core/enum/transaction-type.enum';

export interface DeleteTransactionInput {
  coupleId: string;
  transactionId: string;
}

export interface DeleteTransactionOutput {
  success: boolean;
  deleted_transaction_id: string;
}

/**
 * Delete Transaction Use Case
 *
 * Deletes a transaction and reverts its effects
 *
 * Business Rules:
 * - Transaction must exist and belong to the couple
 * - Reverts account balance changes (INCOME: subtract, EXPENSE: add back)
 * - If was free_spending: adds back to user's free spending
 * - All operations in a single transaction (atomicity)
 * - Emits TransactionDeletedEvent for reactive logic
 */
@Injectable()
export class DeleteTransactionUseCase
  implements IUseCase<DeleteTransactionInput, DeleteTransactionOutput>
{
  constructor(
    @Inject('ITransactionRepository')

    private readonly transactionRepository: ITransactionRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: DeleteTransactionInput): Promise<DeleteTransactionOutput> {
    this.logger.logUseCase('DeleteTransactionUseCase', {
      coupleId: input.coupleId,
      transactionId: input.transactionId,
    });

    // Get transaction
    const transaction = await this.transactionRepository.findById(input.transactionId);
    if (!transaction) {
      throw new TransactionNotFoundException(input.transactionId);
    }

    // Execute deletion atomically
    await this.unitOfWork.execute(async (prisma) => {
      // Revert account balance
      const balanceChange = transaction.type === TransactionType.INCOME 
        ? -transaction.amount 
        : transaction.amount;

      await prisma.account.update({
        where: { id: transaction.account_id },
        data: {
          current_balance: {
            increment: balanceChange,
          },
        },
      });

      // Revert free spending if applicable
      if (transaction.type === TransactionType.EXPENSE && transaction.is_free_spending) {
        const couple = await prisma.couple.findUnique({
          where: { id: input.coupleId },
        });

        if (couple) {
          const isUserA = couple.user_id_a === transaction.paid_by_id;
          await prisma.couple.update({
            where: { id: input.coupleId },
            data: isUserA
              ? { free_spending_a_remaining: { increment: transaction.amount } }
              : { free_spending_b_remaining: { increment: transaction.amount } },
          });
        }
      }

      // Delete transaction
      await prisma.transaction.delete({
        where: { id: input.transactionId },
      });
    });

    // Emit event
    this.eventEmitter.emit('transaction.deleted', {
      transactionId: input.transactionId,
      coupleId: input.coupleId,
      userId: transaction.paid_by_id,
      type: transaction.type,
      amount: transaction.amount,
    });

    this.logger.log('Transaction deleted successfully', {
      transactionId: input.transactionId,
      coupleId: input.coupleId,
    });

    return {
      success: true,
      deleted_transaction_id: input.transactionId,
    };
  }
}
