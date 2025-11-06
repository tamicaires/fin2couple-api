import { Transaction as PrismaTransaction, TransactionType as PrismaTransactionType, TransactionVisibility as PrismaTransactionVisibility, Prisma } from '@prisma/client';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { TransactionType } from '@core/enum/transaction-type.enum';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';

/**
 * Prisma Transaction Mapper
 *
 * Converts Prisma Decimal to number for amount
 */
export class PrismaTransactionMapper {
  static toDomain(prismaTransaction: PrismaTransaction): Transaction {
    return new Transaction({
      id: prismaTransaction.id,
      couple_id: prismaTransaction.couple_id,
      type: prismaTransaction.type as TransactionType,
      amount: Number(prismaTransaction.amount),
      description: prismaTransaction.description,
      paid_by_id: prismaTransaction.paid_by_id,
      account_id: prismaTransaction.account_id,
      is_free_spending: prismaTransaction.is_free_spending,
      is_couple_expense: prismaTransaction.is_couple_expense,
      visibility: prismaTransaction.visibility as TransactionVisibility,
      category: prismaTransaction.category_id,
      transaction_date: prismaTransaction.transaction_date,
      created_at: prismaTransaction.created_at,
      installment_group_id: prismaTransaction.installment_group_id,
      installment_number: prismaTransaction.installment_number,
      total_installments: prismaTransaction.total_installments,
      recurring_template_id: prismaTransaction.recurring_template_id,
    });
  }

  static toPrisma(transaction: Transaction): Omit<PrismaTransaction, 'created_at'> {
    return {
      id: transaction.id,
      couple_id: transaction.couple_id,
      type: transaction.type as PrismaTransactionType,
      amount: new Prisma.Decimal(transaction.amount),
      description: transaction.description,
      paid_by_id: transaction.paid_by_id,
      account_id: transaction.account_id,
      is_free_spending: transaction.is_free_spending,
      is_couple_expense: transaction.is_couple_expense,
      visibility: transaction.visibility as PrismaTransactionVisibility,
      category_id: transaction.category,
      transaction_date: transaction.transaction_date,
      installment_group_id: transaction.installment_group_id,
      installment_number: transaction.installment_number,
      total_installments: transaction.total_installments,
      recurring_template_id: transaction.recurring_template_id,
    };
  }
}
