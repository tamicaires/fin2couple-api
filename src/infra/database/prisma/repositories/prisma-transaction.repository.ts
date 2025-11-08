import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaTenantService } from '../prisma-tenant.service';
import {
  ITransactionRepository,
  TransactionFilters,
  MonthlyStats,
} from '@core/domain/repositories/transaction.repository';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { PrismaTransactionMapper } from '../mappers/prisma-transaction.mapper';
import { PaginationInput, PaginationOutput } from '@shared/types/pagination.type';
import { TransactionType } from '@core/enum/transaction-type.enum';

@Injectable()
export class PrismaTransactionRepository implements ITransactionRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: PrismaTenantService,
  ) {}

  async findById(id: string): Promise<Transaction | null> {
    const coupleId = this.tenant.getCoupleId();

    const transaction = await this.prisma.transaction.findFirst({
      where: {
        id,
        couple_id: coupleId,
      },
    });

    return transaction ? PrismaTransactionMapper.toDomain(transaction) : null;
  }

  async findByCoupleId(
    coupleId: string,
    pagination?: PaginationInput,
  ): Promise<PaginationOutput<Transaction>> {
    const limit = pagination?.limit || 20;
    const cursor = pagination?.cursor;

    const transactions = await this.prisma.transaction.findMany({
      where: { couple_id: coupleId },
      take: limit + 1, // +1 to check if there's more
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { transaction_date: 'desc' },
    });

    const hasMore = transactions.length > limit;
    const data = hasMore ? transactions.slice(0, -1) : transactions;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data: data.map(PrismaTransactionMapper.toDomain),
      nextCursor,
      hasMore,
    };
  }

  async findByFilters(
    filters: TransactionFilters,
    pagination?: PaginationInput,
  ): Promise<PaginationOutput<Transaction>> {
    const limit = pagination?.limit || 20;
    const cursor = pagination?.cursor;

    const where: any = {
      couple_id: filters.coupleId,
    };

    // Privacy filtering based on accounts and visibility
    if (filters.userId) {
      where.OR = [
        // 1. Transactions from joint accounts (owner_id = null) with SHARED visibility
        {
          account: { owner_id: null },
          visibility: 'SHARED',
        },
        // 2. Transactions from joint accounts (owner_id = null) with PRIVATE visibility, but only user's own
        {
          account: { owner_id: null },
          visibility: 'PRIVATE',
          paid_by_id: filters.userId,
        },
        // 3. All transactions from user's personal accounts
        {
          account: { owner_id: filters.userId },
        },
        // 4. Transactions from other's personal accounts with SHARED visibility
        {
          AND: [
            { account: { owner_id: { not: null } } },
            { account: { owner_id: { not: filters.userId } } },
            { visibility: 'SHARED' },
          ],
        },
      ];
    }

    if (filters.type) where.type = filters.type;
    if (filters.paidById) where.paid_by_id = filters.paidById;
    if (filters.accountId) where.account_id = filters.accountId;
    if (filters.category) where.category = filters.category;
    if (filters.isCoupleExpense !== undefined) where.is_couple_expense = filters.isCoupleExpense;
    if (filters.installmentGroupId) where.installment_group_id = filters.installmentGroupId;
    if (filters.recurringTemplateId) where.recurring_template_id = filters.recurringTemplateId;

    if (filters.startDate || filters.endDate) {
      where.transaction_date = {};
      if (filters.startDate) where.transaction_date.gte = filters.startDate;
      if (filters.endDate) where.transaction_date.lte = filters.endDate;
    }

    if (filters.search) {
      where.description = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    const transactions = await this.prisma.transaction.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { transaction_date: 'desc' },
      include: {
        account: true, // Include account to check owner_id
      },
    });

    const hasMore = transactions.length > limit;
    const data = hasMore ? transactions.slice(0, -1) : transactions;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data: data.map(PrismaTransactionMapper.toDomain),
      nextCursor,
      hasMore,
    };
  }

  async create(transaction: Transaction): Promise<Transaction> {
    const created = await this.prisma.transaction.create({
      data: PrismaTransactionMapper.toPrisma(transaction),
    });

    return PrismaTransactionMapper.toDomain(created);
  }

  async update(id: string, data: Partial<Transaction>): Promise<Transaction> {
    const coupleId = this.tenant.getCoupleId();

    // Only extract updatable fields (no methods, no immutable fields)
    const updateData: any = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.paid_by_id !== undefined) updateData.paid_by_id = data.paid_by_id;
    if (data.account_id !== undefined) updateData.account_id = data.account_id;
    if (data.is_free_spending !== undefined) updateData.is_free_spending = data.is_free_spending;
    if (data.is_couple_expense !== undefined) updateData.is_couple_expense = data.is_couple_expense;
    if (data.category !== undefined) updateData.category_id = data.category;
    if (data.transaction_date !== undefined) updateData.transaction_date = data.transaction_date;

    const updated = await this.prisma.transaction.update({
      where: {
        id,
        couple_id: coupleId,
      },
      data: updateData,
    });

    return PrismaTransactionMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const coupleId = this.tenant.getCoupleId();

    await this.prisma.transaction.delete({
      where: {
        id,
        couple_id: coupleId,
      },
    });
  }

  async countByCoupleId(coupleId: string): Promise<number> {
    return await this.prisma.transaction.count({
      where: { couple_id: coupleId },
    });
  }

  async countByMonth(coupleId: string, year: number, month: number): Promise<number> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    return await this.prisma.transaction.count({
      where: {
        couple_id: coupleId,
        transaction_date: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  async countByAccountId(accountId: string): Promise<number> {
    const coupleId = this.tenant.getCoupleId();

    return await this.prisma.transaction.count({
      where: {
        account_id: accountId,
        couple_id: coupleId,
      },
    });
  }

  async getMonthlyStats(coupleId: string, year: number, month: number): Promise<MonthlyStats> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const [incomeResult, expenseResult, coupleExpenseResult, individualExpenseResult] = await Promise.all([
      this.prisma.transaction.aggregate({
        where: {
          couple_id: coupleId,
          type: TransactionType.INCOME,
          transaction_date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          couple_id: coupleId,
          type: TransactionType.EXPENSE,
          transaction_date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          couple_id: coupleId,
          type: TransactionType.EXPENSE,
          is_couple_expense: true,
          transaction_date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
      this.prisma.transaction.aggregate({
        where: {
          couple_id: coupleId,
          type: TransactionType.EXPENSE,
          is_couple_expense: false,
          transaction_date: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
      }),
    ]);

    return {
      totalIncome: Number(incomeResult._sum.amount) || 0,
      totalExpenses: Number(expenseResult._sum.amount) || 0,
      coupleExpenses: Number(coupleExpenseResult._sum.amount) || 0,
      individualExpenses: Number(individualExpenseResult._sum.amount) || 0,
    };
  }

  async getTotalByUser(
    coupleId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        couple_id: coupleId,
        paid_by_id: userId,
        transaction_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }

  async getIndividualExpensesTotal(
    coupleId: string,
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.transaction.aggregate({
      where: {
        couple_id: coupleId,
        paid_by_id: userId,
        type: TransactionType.EXPENSE,
        is_couple_expense: false, // Only individual expenses
        transaction_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: { amount: true },
    });

    return Number(result._sum.amount) || 0;
  }

  async findByInstallmentGroup(coupleId: string, installmentGroupId: string): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        couple_id: coupleId,
        installment_group_id: installmentGroupId,
      },
      orderBy: { installment_number: 'asc' },
    });

    return transactions.map(PrismaTransactionMapper.toDomain);
  }

  async findFutureInstallments(
    coupleId: string,
    installmentGroupId: string,
    fromDate: Date,
  ): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        couple_id: coupleId,
        installment_group_id: installmentGroupId,
        transaction_date: {
          gte: fromDate,
        },
      },
      orderBy: { installment_number: 'asc' },
    });

    return transactions.map(PrismaTransactionMapper.toDomain);
  }

  async createBatch(transactions: Transaction[]): Promise<Transaction[]> {
    const created = await this.prisma.$transaction(
      transactions.map((transaction) =>
        this.prisma.transaction.create({
          data: PrismaTransactionMapper.toPrisma(transaction),
        }),
      ),
    );

    return created.map(PrismaTransactionMapper.toDomain);
  }

  async updateBatch(transactionIds: string[], data: Partial<Transaction>): Promise<void> {
    const coupleId = this.tenant.getCoupleId();

    // Only extract updatable fields
    const updateData: Record<string, unknown> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.paid_by_id !== undefined) updateData.paid_by_id = data.paid_by_id;
    if (data.account_id !== undefined) updateData.account_id = data.account_id;
    if (data.is_free_spending !== undefined) updateData.is_free_spending = data.is_free_spending;
    if (data.is_couple_expense !== undefined) updateData.is_couple_expense = data.is_couple_expense;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.category !== undefined) updateData.category_id = data.category;
    if (data.transaction_date !== undefined) updateData.transaction_date = data.transaction_date;

    await this.prisma.transaction.updateMany({
      where: {
        id: { in: transactionIds },
        couple_id: coupleId,
      },
      data: updateData,
    });
  }

  async deleteBatch(transactionIds: string[]): Promise<void> {
    const coupleId = this.tenant.getCoupleId();

    await this.prisma.transaction.deleteMany({
      where: {
        id: { in: transactionIds },
        couple_id: coupleId,
      },
    });
  }
}
