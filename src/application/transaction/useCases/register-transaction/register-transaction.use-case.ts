import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { AccountNotFoundException } from '@core/exceptions/account/account-not-found.exception';
import { CoupleNotFoundException } from '@core/exceptions/couple/couple-not-found.exception';
import { InsufficientFreeSpendingException } from '@core/exceptions/transaction/insufficient-free-spending.exception';
import { LoggerService } from '@infra/logging/logger.service';
import { UnitOfWork } from '@infra/database/prisma/unit-of-work';
import { UserTransactionType, TransactionType } from '@core/enum/transaction-type.enum';
import { TransactionRegisteredEvent } from '@application/events/domain-events/transaction-registered.event';
import { TransactionVisibility } from '@prisma/client';

export interface RegisterTransactionInput {
  coupleId: string;
  userId: string;
  account_id: string;
  type: UserTransactionType; // Only INCOME or EXPENSE (excludes ADJUSTMENT)
  amount: number;
  category_id?: string;
  description?: string;
  transaction_date?: Date;
  is_free_spending?: boolean;
  visibility?: TransactionVisibility; // SHARED, FREE_SPENDING, or PRIVATE
}

export interface RegisterTransactionOutput {
  id: string;
  couple_id: string;
  account_id: string;
  type: TransactionType;
  amount: number;
  category_id: string | null;
  description: string | null;
  transaction_date: Date;
  is_free_spending: boolean;
  visibility: TransactionVisibility;
  created_at: Date;
}

/**
 * Register Transaction Use Case
 *
 * Registers a financial transaction and updates balances
 *
 * Business Rules:
 * - INCOME: Increases account balance
 * - EXPENSE: Decreases account balance
 * - If EXPENSE + is_free_spending: deducts from user's free spending
 * - If free spending insufficient: throws exception
 * - All operations in a single transaction (atomicity)
 * - Emits TransactionRegisteredEvent for reactive logic
 */
@Injectable()
export class RegisterTransactionUseCase
  implements IUseCase<RegisterTransactionInput, RegisterTransactionOutput>
{
  constructor(
    @Inject('IAccountRepository')

    private readonly accountRepository: IAccountRepository,
    @Inject('ICoupleRepository')

    private readonly coupleRepository: ICoupleRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: RegisterTransactionInput): Promise<RegisterTransactionOutput> {
    this.logger.logUseCase('RegisterTransactionUseCase', {
      coupleId: input.coupleId,
      userId: input.userId,
      type: input.type,
      amount: input.amount,
    });

    // Validate account exists
    const account = await this.accountRepository.findById(input.account_id);
    if (!account) {
      throw new AccountNotFoundException(input.account_id);
    }

    // Validate couple exists
    const couple = await this.coupleRepository.findById(input.coupleId);
    if (!couple) {
      throw new CoupleNotFoundException(input.coupleId);
    }

    // FINANCIAL MODEL GUARD: Validate if private transactions are allowed
    if (input.visibility === 'PRIVATE' && !couple.allow_private_transactions) {
      throw new ForbiddenException(
        'Transações privadas não estão habilitadas para este casal. ' +
        'Altere o modelo financeiro em Configurações para permitir transações privadas.',
      );
    }

    // Check free spending if applicable
    if (input.type === TransactionType.EXPENSE && input.is_free_spending) {
      const isUserA = couple.isUserA(input.userId);
      const freeSpendingRemaining = isUserA
        ? couple.free_spending_a_remaining
        : couple.free_spending_b_remaining;

      if (freeSpendingRemaining < input.amount) {
        throw new InsufficientFreeSpendingException(freeSpendingRemaining);
      }
    }

    // Determine default visibility based on account type
    const defaultVisibility = account.owner_id ? 'PRIVATE' : 'SHARED';
    const visibility = input.visibility ?? defaultVisibility;

    // Execute transaction atomically
    const result = await this.unitOfWork.execute(async (prisma) => {
      // Create transaction
      const createdTransaction = await prisma.transaction.create({
        data: {
          couple_id: input.coupleId,
          account_id: input.account_id,
          paid_by_id: input.userId,
          type: input.type,
          amount: input.amount,
          category_id: input.category_id || null,
          description: input.description || null,
          transaction_date: input.transaction_date || new Date(),
          is_free_spending: input.is_free_spending || false,
          is_couple_expense: false,
          visibility,
        },
      });

      // Update account balance
      const balanceChange = input.type === TransactionType.INCOME ? input.amount : -input.amount;
      await prisma.account.update({
        where: { id: input.account_id },
        data: {
          current_balance: {
            increment: balanceChange,
          },
        },
      });

      // Update free spending if applicable
      if (input.type === TransactionType.EXPENSE && input.is_free_spending) {
        const isUserA = couple.isUserA(input.userId);
        await prisma.couple.update({
          where: { id: input.coupleId },
          data: isUserA
            ? { free_spending_a_remaining: { decrement: input.amount } }
            : { free_spending_b_remaining: { decrement: input.amount } },
        });
      }

      return createdTransaction;
    });

    // Emit event for reactive logic (gamification, analytics, etc.)
    this.eventEmitter.emit(
      'transaction.registered',
      new TransactionRegisteredEvent(
        result.id,
        input.userId,
        input.coupleId,
        input.amount,
        input.type,
      ),
    );

    this.logger.log('Transaction registered successfully', {
      transactionId: result.id,
      coupleId: input.coupleId,
      type: input.type,
      amount: input.amount,
    });

    return {
      id: result.id,
      couple_id: result.couple_id,
      account_id: result.account_id,
      type: result.type as TransactionType,
      amount: Number(result.amount),
      category_id: result.category_id,
      description: result.description,
      transaction_date: result.transaction_date,
      is_free_spending: result.is_free_spending,
      visibility: result.visibility,
      created_at: result.created_at,
    };
  }
}
