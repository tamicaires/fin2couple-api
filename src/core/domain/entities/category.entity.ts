import { randomUUID } from 'crypto';
import { z } from 'zod';
import { CategoryTransactionType } from '@core/enum/transaction-type.enum';

export class Category {
  id: string;
  couple_id: string;
  name: string;
  icon: string;
  color: string;
  type: CategoryTransactionType | null;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;

  constructor(data: CategoryType) {
    const validatedData = categorySchema.parse(data);
    Object.assign(this, validatedData);
    this.id = validatedData.id ?? randomUUID();
    this.created_at = validatedData.created_at ?? new Date();
    this.updated_at = validatedData.updated_at ?? new Date();
  }

  canBeDeleted(): boolean {
    return !this.is_default;
  }

  isApplicableToTransactionType(transactionType: CategoryTransactionType): boolean {
    // null type means applicable to both INCOME and EXPENSE
    return this.type === null || this.type === transactionType;
  }
}

export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  couple_id: z.string().uuid(),
  name: z.string().min(1).max(50),
  icon: z.string().default('Circle'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6b7280'),
  type: z.enum(['INCOME', 'EXPENSE']).nullable().default(null),
  is_default: z.boolean().default(false),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type CategoryType = z.infer<typeof categorySchema>;
