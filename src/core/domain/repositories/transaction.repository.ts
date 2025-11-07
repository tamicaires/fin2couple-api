import { Transaction } from '../entities/transaction.entity';
import { TransactionType } from '@core/enum/transaction-type.enum';
import { PaginationInput, PaginationOutput } from '@shared/types/pagination.type';

export interface TransactionFilters {
  coupleId: string;
  userId?: string; // For privacy filtering
  type?: TransactionType;
  paidById?: string;
  accountId?: string;
  category?: string;
  startDate?: Date;
  endDate?: Date;
  isCoupleExpense?: boolean;
  search?: string;
  installmentGroupId?: string;
  recurringTemplateId?: string;
}

export interface MonthlyStats {
  totalIncome: number;
  totalExpenses: number;
  coupleExpenses: number;
  individualExpenses: number;
}

/**
 * Transaction Repository Interface (Contract)
 *
 * IMPORTANT: All queries MUST filter by couple_id
 */
export interface ITransactionRepository {
  findById(id: string): Promise<Transaction | null>;
  findByCoupleId(coupleId: string, pagination?: PaginationInput): Promise<PaginationOutput<Transaction>>;
  findByFilters(filters: TransactionFilters, pagination?: PaginationInput): Promise<PaginationOutput<Transaction>>;
  create(transaction: Transaction): Promise<Transaction>;
  update(id: string, data: Partial<Transaction>): Promise<Transaction>;
  delete(id: string): Promise<void>;

  // Business queries
  countByCoupleId(coupleId: string): Promise<number>;
  countByMonth(coupleId: string, year: number, month: number): Promise<number>;

  // Stats queries
  getMonthlyStats(coupleId: string, year: number, month: number): Promise<MonthlyStats>;
  getTotalByUser(coupleId: string, userId: string, startDate: Date, endDate: Date): Promise<number>;

  // Free Spending queries
  getIndividualExpensesTotal(
    coupleId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number>;

  // Installment queries
  findByInstallmentGroup(coupleId: string, installmentGroupId: string): Promise<Transaction[]>;
  findFutureInstallments(coupleId: string, installmentGroupId: string, fromDate: Date): Promise<Transaction[]>;
  createBatch(transactions: Transaction[]): Promise<Transaction[]>;
  updateBatch(transactionIds: string[], data: Partial<Transaction>): Promise<void>;
  deleteBatch(transactionIds: string[]): Promise<void>;
}
