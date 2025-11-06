import { randomUUID } from 'crypto';
import { z } from 'zod';
import { TransactionType } from '@core/enum/transaction-type.enum';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';

export class Transaction {
  id: string;
  couple_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  paid_by_id: string;
  account_id: string;
  is_free_spending: boolean;
  is_couple_expense: boolean;
  visibility: TransactionVisibility;
  category: string | null;
  transaction_date: Date;
  created_at: Date;

  // Installment fields
  installment_group_id: string | null;
  installment_number: number | null;
  total_installments: number | null;

  // Recurring fields
  recurring_template_id: string | null;

  constructor(data: TransactionEntityType) {
    const validatedData = transactionSchema.parse(data);
    Object.assign(this, validatedData);
    this.id = validatedData.id ?? randomUUID();
    this.transaction_date = validatedData.transaction_date ?? new Date();
    this.created_at = validatedData.created_at ?? new Date();
    this.installment_group_id = validatedData.installment_group_id ?? null;
    this.installment_number = validatedData.installment_number ?? null;
    this.total_installments = validatedData.total_installments ?? null;
    this.recurring_template_id = validatedData.recurring_template_id ?? null;
  }

  // Helper: Check if it's an expense
  isExpense(): boolean {
    return this.type === TransactionType.EXPENSE;
  }

  // Helper: Check if it's an income
  isIncome(): boolean {
    return this.type === TransactionType.INCOME;
  }

  // Helper: Check if it affects free spending
  affectsFreeSpending(): boolean {
    return this.isExpense() && !this.is_couple_expense;
  }

  // Helper: Get formatted amount with currency
  getFormattedAmount(): string {
    return `R$ ${this.amount.toFixed(2)}`;
  }

  // Helper: Get transaction type label
  getTypeLabel(): string {
    return this.isIncome() ? 'Income' : 'Expense';
  }

  // Helper: Get expense type label
  getExpenseTypeLabel(): string {
    if (!this.isExpense()) return '-';
    return this.is_couple_expense ? 'Joint Expense' : 'Individual Expense';
  }

  // Helper: Check if transaction is part of an installment plan
  isInstallment(): boolean {
    return this.installment_group_id !== null;
  }

  // Helper: Check if transaction is part of a recurring plan
  isRecurring(): boolean {
    return this.recurring_template_id !== null;
  }

  // Helper: Get installment label (e.g., "3/12")
  getInstallmentLabel(): string | null {
    if (!this.isInstallment() || !this.installment_number || !this.total_installments) {
      return null;
    }
    return `${this.installment_number}/${this.total_installments}`;
  }

  // Helper: Check if this is the first installment
  isFirstInstallment(): boolean {
    return this.installment_number === 1;
  }

  // Helper: Check if this is the last installment
  isLastInstallment(): boolean {
    return (
      this.installment_number !== null &&
      this.total_installments !== null &&
      this.installment_number === this.total_installments
    );
  }
}

export const transactionSchema = z
  .object({
    id: z.string().uuid().optional(),
    couple_id: z.string().uuid(),
    type: z.nativeEnum(TransactionType),
    amount: z.number().positive(),
    description: z.string().nullable().optional(),
    paid_by_id: z.string().uuid(),
    account_id: z.string().uuid(),
    is_free_spending: z.boolean().default(false),
    is_couple_expense: z.boolean().default(false),
    visibility: z.nativeEnum(TransactionVisibility).default(TransactionVisibility.SHARED),
    category: z.string().nullable().optional(),
    transaction_date: z.date().optional(),
    created_at: z.date().optional(),

    // Installment fields
    installment_group_id: z.string().uuid().nullable().optional(),
    installment_number: z.number().int().positive().nullable().optional(),
    total_installments: z.number().int().positive().nullable().optional(),

    // Recurring fields
    recurring_template_id: z.string().uuid().nullable().optional(),
  })
  .refine(
    (data) => {
      // If any installment field is provided, all must be provided
      const hasAnyInstallment =
        data.installment_group_id !== null ||
        data.installment_number !== null ||
        data.total_installments !== null;

      if (!hasAnyInstallment) return true;

      return (
        data.installment_group_id !== null &&
        data.installment_number !== null &&
        data.total_installments !== null &&
        data.installment_number !== undefined &&
        data.total_installments !== undefined &&
        data.installment_number <= data.total_installments
      );
    },
    {
      message: 'All installment fields must be provided together and installment_number must be <= total_installments',
    },
  );

export type TransactionEntityType = z.infer<typeof transactionSchema>;
