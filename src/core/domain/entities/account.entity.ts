import { randomUUID } from 'crypto';
import { z } from 'zod';
import { AccountType as AccountTypeEnum } from '@core/enum/account-type.enum';

export class Account {
  id: string;
  couple_id: string;
  owner_id: string | null;
  name: string;
  type: AccountTypeEnum;
  current_balance: number;
  created_at: Date;
  updated_at: Date;

  get balance(): number {
    return this.current_balance;
  }

  set balance(value: number) {
    this.current_balance = value;
  }

  constructor(data: AccountType) {
    const validatedData = accountSchema.parse(data);
    Object.assign(this, validatedData);
    this.id = validatedData.id ?? randomUUID();
    this.created_at = validatedData.created_at ?? new Date();
    this.updated_at = validatedData.updated_at ?? new Date();
  }

  // Helper: Check if account is joint
  isJointAccount(): boolean {
    return this.owner_id === null;
  }

  // Helper: Check if user owns this account
  isOwnedBy(userId: string): boolean {
    return this.owner_id === userId;
  }

  // Helper: Update balance (add/subtract)
  updateBalance(amount: number): void {
    this.current_balance += amount;
  }

  // Helper: Check if has sufficient balance
  hasSufficientBalance(amount: number): boolean {
    return this.current_balance >= amount;
  }

  // Helper: Get account type label
  getTypeLabel(): string {
    return this.isJointAccount() ? 'Joint Account' : 'Individual Account';
  }
}

export const accountSchema = z.object({
  id: z.string().uuid().optional(),
  couple_id: z.string().uuid(),
  owner_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  type: z.nativeEnum(AccountTypeEnum),
  current_balance: z.number().default(0),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type AccountType = z.infer<typeof accountSchema>;
