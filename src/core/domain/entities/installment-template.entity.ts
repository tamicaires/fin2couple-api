import { z } from 'zod';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';

export interface InstallmentTemplateProps {
  id?: string;
  couple_id: string;
  description?: string;
  total_amount: number;
  total_installments: number;
  paid_by_id: string;
  account_id: string;
  category_id?: string;
  is_couple_expense?: boolean;
  is_free_spending?: boolean;
  visibility: TransactionVisibility;
  first_due_date: Date;
  is_active?: boolean;
  created_at?: Date;
  updated_at?: Date;
}

export class InstallmentTemplate {
  readonly id: string;
  readonly couple_id: string;
  readonly description: string | null;
  readonly total_amount: number;
  readonly total_installments: number;
  readonly paid_by_id: string;
  readonly account_id: string;
  readonly category_id: string | null;
  readonly is_couple_expense: boolean;
  readonly is_free_spending: boolean;
  readonly visibility: TransactionVisibility;
  readonly first_due_date: Date;
  private _is_active: boolean;
  readonly created_at: Date;
  readonly updated_at: Date;

  constructor(props: InstallmentTemplateProps) {
    const validated = InstallmentTemplate.validate(props);

    this.id = validated.id ?? this.generateId();
    this.couple_id = validated.couple_id;
    this.description = validated.description ?? null;
    this.total_amount = validated.total_amount;
    this.total_installments = validated.total_installments;
    this.paid_by_id = validated.paid_by_id;
    this.account_id = validated.account_id;
    this.category_id = validated.category_id ?? null;
    this.is_couple_expense = validated.is_couple_expense ?? false;
    this.is_free_spending = validated.is_free_spending ?? false;
    this.visibility = validated.visibility;
    this.first_due_date = validated.first_due_date;
    this._is_active = validated.is_active ?? true;
    this.created_at = validated.created_at ?? new Date();
    this.updated_at = validated.updated_at ?? new Date();
  }

  // Getters
  get is_active(): boolean {
    return this._is_active;
  }

  // Business methods
  isActive(): boolean {
    return this._is_active;
  }

  canBeDeactivated(): boolean {
    return this._is_active;
  }

  canBeActivated(): boolean {
    return !this._is_active;
  }

  getInstallmentAmount(): number {
    return this.total_amount / this.total_installments;
  }

  calculateDueDate(installmentNumber: number): Date {
    if (installmentNumber < 1 || installmentNumber > this.total_installments) {
      throw new Error('Invalid installment number');
    }

    const dueDate = new Date(this.first_due_date);
    dueDate.setMonth(dueDate.getMonth() + (installmentNumber - 1));
    return dueDate;
  }

  deactivate(): void {
    if (!this.canBeDeactivated()) {
      throw new Error('Template is already inactive');
    }

    this._is_active = false;
  }

  activate(): void {
    if (!this.canBeActivated()) {
      throw new Error('Template is already active');
    }

    this._is_active = true;
  }

  // Validation
  private static validate(props: InstallmentTemplateProps): InstallmentTemplateProps {
    const schema = z.object({
      id: z.string().uuid().optional(),
      couple_id: z.string().uuid({ message: 'Couple ID must be a valid UUID' }),
      description: z.string().optional(),
      total_amount: z
        .number({ required_error: 'Total amount is required' })
        .positive({ message: 'Total amount must be positive' }),
      total_installments: z
        .number({ required_error: 'Total installments is required' })
        .int({ message: 'Total installments must be an integer' })
        .min(2, { message: 'Minimum 2 installments required' })
        .max(120, { message: 'Maximum 120 installments allowed' }),
      paid_by_id: z.string().uuid({ message: 'Paid by ID must be a valid UUID' }),
      account_id: z.string().uuid({ message: 'Account ID must be a valid UUID' }),
      category_id: z.string().uuid().optional(),
      is_couple_expense: z.boolean().optional(),
      is_free_spending: z.boolean().optional(),
      visibility: z.nativeEnum(TransactionVisibility),
      first_due_date: z.date({ required_error: 'First due date is required' }),
      is_active: z.boolean().optional(),
      created_at: z.date().optional(),
      updated_at: z.date().optional(),
    });

    return schema.parse(props);
  }

  private generateId(): string {
    return crypto.randomUUID();
  }

  // Factory method
  static create(
    props: Omit<InstallmentTemplateProps, 'id' | 'created_at' | 'updated_at'>,
  ): InstallmentTemplate {
    return new InstallmentTemplate(props);
  }

  // To persistence
  toPersistence() {
    return {
      id: this.id,
      couple_id: this.couple_id,
      description: this.description,
      total_amount: this.total_amount,
      total_installments: this.total_installments,
      paid_by_id: this.paid_by_id,
      account_id: this.account_id,
      category_id: this.category_id,
      is_couple_expense: this.is_couple_expense,
      is_free_spending: this.is_free_spending,
      visibility: this.visibility,
      first_due_date: this.first_due_date,
      is_active: this._is_active,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
