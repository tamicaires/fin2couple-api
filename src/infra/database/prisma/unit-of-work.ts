import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * Unit of Work Pattern for Prisma Transactions
 * 
 * Ensures atomicity: either ALL operations succeed or ALL fail.
 * Example: Creating a transaction + updating account balance + updating free spending
 * 
 * Usage:
 * await this.unitOfWork.execute(async (prisma) => {
 *   await prisma.transaction.create({ data });
 *   await prisma.account.update({ where, data });
 *   await prisma.couple.update({ where, data });
 * });
 */
@Injectable()
export class UnitOfWork {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Executes multiple operations in a single transaction
   * If any operation fails, all changes are rolled back
   */
  async execute<T>(
    fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>,
  ): Promise<T> {
    return await this.prisma.$transaction(fn);
  }

  /**
   * Executes operations with interactive transaction options
   * Allows custom timeout and isolation level
   */
  async executeWithOptions<T>(
    fn: (prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$extends'>) => Promise<T>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): Promise<T> {
    return await this.prisma.$transaction(fn, options);
  }

  /**
   * Batch operations (faster for bulk inserts)
   * NOT wrapped in transaction - use for independent bulk operations
   */
  async batchCreate<T>(
    model: string,
    data: T[],
  ): Promise<Prisma.BatchPayload> {
    // Type assertion needed for dynamic model access
    const modelDelegate = (this.prisma as any)[model];
    return await modelDelegate.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
