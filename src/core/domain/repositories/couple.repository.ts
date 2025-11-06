import { Couple } from '../entities/couple.entity';
import { FinancialModel } from '@prisma/client';

/**
 * Couple Repository Interface (Contract)
 *
 * Defines the contract for Couple data access.
 * CRITICAL: This is the Tenant entity for multi-tenancy
 */
export interface ICoupleRepository {
  findById(id: string): Promise<Couple | null>;
  findByUserId(userId: string): Promise<Couple | null>;
  findAll(): Promise<Couple[]>;
  create(couple: Couple): Promise<Couple>;
  update(id: string, data: Partial<Couple>): Promise<Couple>;
  delete(id: string): Promise<void>;

  // Business queries
  existsByUserId(userId: string): Promise<boolean>;
  findCouplesNeedingReset(today: Date): Promise<Couple[]>;

  // Free Spending operations
  updateFreeSpending(
    coupleId: string,
    userId: string,
    newMonthlyAmount: number,
    newRemainingAmount: number,
  ): Promise<void>;

  resetFreeSpending(coupleId: string): Promise<void>;

  // Financial Model operations
  updateFinancialModel(
    coupleId: string,
    data: {
      financial_model: FinancialModel;
      allow_personal_accounts: boolean;
      allow_private_transactions: boolean;
    },
  ): Promise<void>;
}
