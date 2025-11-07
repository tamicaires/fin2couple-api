import { z } from 'zod';
import { OccurrenceStatus } from '@core/enum/occurrence-status.enum';

export interface RecurringOccurrenceProps {
  id?: string;
  template_id: string;
  due_date: Date;
  status?: OccurrenceStatus;
  transaction_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export class RecurringOccurrence {
  readonly id: string;
  readonly template_id: string;
  readonly due_date: Date;
  private _status: OccurrenceStatus;
  private _transaction_id: string | null;
  readonly created_at: Date;
  readonly updated_at: Date;

  constructor(props: RecurringOccurrenceProps) {
    const validated = RecurringOccurrence.validate(props);

    this.id = validated.id ?? this.generateId();
    this.template_id = validated.template_id;
    this.due_date = validated.due_date;
    this._status = validated.status ?? OccurrenceStatus.PENDING;
    this._transaction_id = validated.transaction_id ?? null;
    this.created_at = validated.created_at ?? new Date();
    this.updated_at = validated.updated_at ?? new Date();
  }

  // Getters
  get status(): OccurrenceStatus {
    return this._status;
  }

  get transaction_id(): string | null {
    return this._transaction_id;
  }

  // Business methods
  isPending(): boolean {
    return this._status === OccurrenceStatus.PENDING;
  }

  isPaid(): boolean {
    return this._status === OccurrenceStatus.PAID;
  }

  isSkipped(): boolean {
    return this._status === OccurrenceStatus.SKIPPED;
  }

  canBePaid(): boolean {
    return this.isPending() && !this.isOverdue();
  }

  canBeSkipped(): boolean {
    return this.isPending();
  }

  isOverdue(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const dueDate = new Date(this.due_date);
    dueDate.setHours(0, 0, 0, 0);

    // Consider overdue if more than 30 days past due
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return dueDate < thirtyDaysAgo;
  }

  markAsPaid(transactionId: string): void {
    if (!this.isPending()) {
      throw new Error('Only pending occurrences can be marked as paid');
    }

    if (!transactionId) {
      throw new Error('Transaction ID is required to mark as paid');
    }

    this._status = OccurrenceStatus.PAID;
    this._transaction_id = transactionId;
  }

  markAsSkipped(): void {
    if (!this.isPending()) {
      throw new Error('Only pending occurrences can be skipped');
    }

    this._status = OccurrenceStatus.SKIPPED;
  }

  // Validation
  private static validate(props: RecurringOccurrenceProps): RecurringOccurrenceProps {
    const schema = z.object({
      id: z.string().uuid().optional(),
      template_id: z.string().uuid({ message: 'Template ID must be a valid UUID' }),
      due_date: z.date({ message: 'Due date is required' }),
      status: z.nativeEnum(OccurrenceStatus).optional(),
      transaction_id: z.string().uuid().nullable().optional(),
      created_at: z.date().optional(),
      updated_at: z.date().optional(),
    });

    return schema.parse(props);
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  // Factory method
  static create(props: Omit<RecurringOccurrenceProps, 'id' | 'created_at' | 'updated_at'>): RecurringOccurrence {
    return new RecurringOccurrence(props);
  }

  // To persistence
  toPersistence() {
    return {
      id: this.id,
      template_id: this.template_id,
      due_date: this.due_date,
      status: this._status,
      transaction_id: this._transaction_id,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
