import { randomUUID } from 'crypto';
import { z } from 'zod';
import { TransactionType } from '@core/enum/transaction-type.enum';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';
import { RecurrenceFrequency } from '@core/enum/recurrence-frequency.enum';
import { addDays, addWeeks, addMonths, addYears } from 'date-fns';

export class RecurringTransactionTemplate {
  id: string;
  couple_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  paid_by_id: string;
  account_id: string;
  is_couple_expense: boolean;
  is_free_spending: boolean;
  visibility: TransactionVisibility;
  category: string | null;

  // Recurrence configuration
  frequency: RecurrenceFrequency;
  interval: number;
  start_date: Date;
  end_date: Date | null;
  next_occurrence: Date;
  is_active: boolean;

  created_at: Date;
  updated_at: Date;

  constructor(data: RecurringTransactionTemplateType) {
    const validatedData = recurringTransactionTemplateSchema.parse(data);
    Object.assign(this, validatedData);
    this.id = validatedData.id ?? randomUUID();
    this.created_at = validatedData.created_at ?? new Date();
    this.updated_at = validatedData.updated_at ?? new Date();
  }

  /**
   * Calculate the next occurrence date based on frequency and interval
   */
  calculateNextOccurrence(): Date {
    const current = this.next_occurrence;

    switch (this.frequency) {
      case RecurrenceFrequency.DAILY:
        return addDays(current, this.interval);
      case RecurrenceFrequency.WEEKLY:
        return addWeeks(current, this.interval);
      case RecurrenceFrequency.MONTHLY:
        return addMonths(current, this.interval);
      case RecurrenceFrequency.YEARLY:
        return addYears(current, this.interval);
      default:
        throw new Error(`Unsupported frequency: ${this.frequency}`);
    }
  }

  /**
   * Check if the template should generate a new transaction
   */
  shouldGenerateTransaction(currentDate: Date = new Date()): boolean {
    if (!this.is_active) return false;
    if (this.next_occurrence > currentDate) return false;
    if (this.end_date && this.next_occurrence > this.end_date) return false;
    return true;
  }

  /**
   * Check if the template has ended
   */
  hasEnded(currentDate: Date = new Date()): boolean {
    if (!this.end_date) return false;
    return currentDate > this.end_date;
  }

  /**
   * Activate the template
   */
  activate(): void {
    this.is_active = true;
    this.updated_at = new Date();
  }

  /**
   * Deactivate/pause the template
   */
  deactivate(): void {
    this.is_active = false;
    this.updated_at = new Date();
  }

  /**
   * Update the next occurrence date
   */
  updateNextOccurrence(): void {
    this.next_occurrence = this.calculateNextOccurrence();
    this.updated_at = new Date();
  }

  /**
   * Get human-readable frequency label
   */
  getFrequencyLabel(): string {
    const intervalText = this.interval > 1 ? `${this.interval} ` : '';

    switch (this.frequency) {
      case RecurrenceFrequency.DAILY:
        return intervalText ? `A cada ${this.interval} dias` : 'Diário';
      case RecurrenceFrequency.WEEKLY:
        return intervalText ? `A cada ${this.interval} semanas` : 'Semanal';
      case RecurrenceFrequency.MONTHLY:
        return intervalText ? `A cada ${this.interval} meses` : 'Mensal';
      case RecurrenceFrequency.YEARLY:
        return intervalText ? `A cada ${this.interval} anos` : 'Anual';
      default:
        return 'Desconhecido';
    }
  }
}

export const recurringTransactionTemplateSchema = z
  .object({
    id: z.string().uuid().optional(),
    couple_id: z.string().uuid(),
    type: z.nativeEnum(TransactionType),
    amount: z.number().positive(),
    description: z.string().nullable().optional(),
    paid_by_id: z.string().uuid(),
    account_id: z.string().uuid(),
    is_couple_expense: z.boolean().default(false),
    is_free_spending: z.boolean().default(false),
    visibility: z.nativeEnum(TransactionVisibility).default(TransactionVisibility.SHARED),
    category: z.string().nullable().optional(),

    // Recurrence configuration
    frequency: z.nativeEnum(RecurrenceFrequency),
    interval: z.number().int().positive().default(1),
    start_date: z.date(),
    end_date: z.date().nullable().optional(),
    next_occurrence: z.date(),
    is_active: z.boolean().default(true),

    created_at: z.date().optional(),
    updated_at: z.date().optional(),
  })
  .refine(
    (data) => {
      // If end_date is provided, it must be after start_date
      if (data.end_date) {
        return data.end_date > data.start_date;
      }
      return true;
    },
    {
      message: 'end_date must be after start_date',
    },
  )
  .refine(
    (data) => {
      // next_occurrence must be >= start_date
      return data.next_occurrence >= data.start_date;
    },
    {
      message: 'next_occurrence must be on or after start_date',
    },
  );

export type RecurringTransactionTemplateType = z.infer<typeof recurringTransactionTemplateSchema>;
