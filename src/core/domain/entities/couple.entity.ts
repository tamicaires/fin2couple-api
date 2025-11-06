import { randomUUID } from 'crypto';
import { z } from 'zod';
import { FinancialModel } from '@prisma/client';

export class Couple {
  id: string;
  user_id_a: string;
  user_id_b: string;
  free_spending_a_monthly: number;
  free_spending_b_monthly: number;
  free_spending_a_remaining: number;
  free_spending_b_remaining: number;
  reset_day: number;
  financial_model: FinancialModel;
  allow_personal_accounts: boolean;
  allow_private_transactions: boolean;
  created_at: Date;
  updated_at: Date;

  constructor(data: CoupleType) {
    const validatedData = coupleSchema.parse(data);
    Object.assign(this, validatedData);
    this.id = validatedData.id ?? randomUUID();
    this.created_at = validatedData.created_at ?? new Date();
    this.updated_at = validatedData.updated_at ?? new Date();
  }

  hasUser(userId: string): boolean {
    return this.user_id_a === userId || this.user_id_b === userId;
  }

  getPartnerId(userId: string): string | null {
    if (this.user_id_a === userId) return this.user_id_b;
    if (this.user_id_b === userId) return this.user_id_a;
    return null;
  }

  isUserA(userId: string): boolean {
    return this.user_id_a === userId;
  }

  isUserB(userId: string): boolean {
    return this.user_id_b === userId;
  }

  getFreeSpendingMonthly(userId: string): number {
    return this.isUserA(userId)
      ? this.free_spending_a_monthly
      : this.free_spending_b_monthly;
  }

  getFreeSpendingRemaining(userId: string): number {
    return this.isUserA(userId)
      ? this.free_spending_a_remaining
      : this.free_spending_b_remaining;
  }

  updateFreeSpending(userId: string, amount: number): void {
    if (this.isUserA(userId)) {
      this.free_spending_a_remaining = amount;
    } else {
      this.free_spending_b_remaining = amount;
    }
  }

  shouldResetToday(today: Date): boolean {
    return today.getDate() === this.reset_day;
  }

  resetFreeSpending(): void {
    this.free_spending_a_remaining = this.free_spending_a_monthly;
    this.free_spending_b_remaining = this.free_spending_b_monthly;
  }
}

export const coupleSchema = z.object({
  id: z.string().uuid().optional(),
  user_id_a: z.string().uuid(),
  user_id_b: z.string().uuid(),
  free_spending_a_monthly: z.number().min(0).default(0),
  free_spending_b_monthly: z.number().min(0).default(0),
  free_spending_a_remaining: z.number().min(0).default(0),
  free_spending_b_remaining: z.number().min(0).default(0),
  reset_day: z.number().int().min(1).max(31).default(1),
  financial_model: z.nativeEnum(FinancialModel).default('CUSTOM'),
  allow_personal_accounts: z.boolean().default(true),
  allow_private_transactions: z.boolean().default(true),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type CoupleType = z.infer<typeof coupleSchema>;
