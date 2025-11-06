import { Injectable, Inject } from '@nestjs/common';
import { IRecurringTransactionTemplateRepository } from '@core/domain/repositories/recurring-transaction-template.repository';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { RecurringTransactionTemplate } from '@core/domain/entities/recurring-transaction-template.entity';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { TransactionType } from '@core/enum/transaction-type.enum';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';
import { RecurrenceFrequency } from '@core/enum/recurrence-frequency.enum';
import { RecurrenceConfig } from '@core/domain/value-objects/recurrence-config.vo';

export interface CreateRecurringTransactionInput {
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
  create_first_transaction: boolean; // If true, creates the first transaction immediately
}

export interface CreateRecurringTransactionOutput {
  template: RecurringTransactionTemplate;
  first_transaction: Transaction | null;
}

/**
 * Use Case: Create Recurring Transaction
 *
 * Creates a template for recurring transactions that will be generated
 * automatically by a scheduler job.
 *
 * Business Rules:
 * - Template stores all transaction details
 * - Optionally creates the first transaction immediately
 * - Scheduler will generate future transactions based on frequency
 * - Template can be paused/resumed/deleted
 *
 * Design Pattern: Factory Method
 * - TransactionFactory creates transactions from templates
 */
@Injectable()
export class CreateRecurringTransactionUseCase {
  constructor(
    @Inject('IRecurringTransactionTemplateRepository')
    private readonly templateRepository: IRecurringTransactionTemplateRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(input: CreateRecurringTransactionInput): Promise<CreateRecurringTransactionOutput> {
    this.validateInput(input);

    // Create recurrence configuration value object
    const recurrenceConfig = RecurrenceConfig.create(
      input.frequency,
      input.interval,
      input.start_date,
      input.end_date,
    );

    // Create the template
    const template = this.createTemplate(input, recurrenceConfig);

    // Save template
    const createdTemplate = await this.templateRepository.create(template);

    // Optionally create first transaction
    let firstTransaction: Transaction | null = null;
    if (input.create_first_transaction) {
      firstTransaction = await this.createFirstTransaction(createdTemplate);
      // Update next occurrence after creating first transaction
      createdTemplate.updateNextOccurrence();
      await this.templateRepository.updateNextOccurrence(createdTemplate.id, createdTemplate.next_occurrence);
    }

    return {
      template: createdTemplate,
      first_transaction: firstTransaction,
    };
  }

  private validateInput(input: CreateRecurringTransactionInput): void {
    if (input.amount <= 0) {
      throw new Error('Amount must be positive');
    }

    if (input.interval < 1) {
      throw new Error('Interval must be at least 1');
    }

    if (input.end_date && input.end_date <= input.start_date) {
      throw new Error('End date must be after start date');
    }
  }

  private createTemplate(
    input: CreateRecurringTransactionInput,
    recurrenceConfig: RecurrenceConfig,
  ): RecurringTransactionTemplate {
    return new RecurringTransactionTemplate({
      couple_id: input.couple_id,
      type: input.type,
      amount: input.amount,
      description: input.description,
      paid_by_id: input.paid_by_id,
      account_id: input.account_id,
      is_couple_expense: input.is_couple_expense,
      is_free_spending: input.is_free_spending,
      visibility: input.visibility,
      category: input.category,
      frequency: recurrenceConfig.frequency,
      interval: recurrenceConfig.interval,
      start_date: recurrenceConfig.startDate,
      end_date: recurrenceConfig.endDate,
      next_occurrence: recurrenceConfig.startDate,
      is_active: true,
    });
  }

  /**
   * Factory Method: Creates a transaction from a template
   */
  private async createFirstTransaction(template: RecurringTransactionTemplate): Promise<Transaction> {
    const transaction = new Transaction({
      couple_id: template.couple_id,
      type: template.type,
      amount: template.amount,
      description: this.buildRecurringDescription(template.description, template),
      paid_by_id: template.paid_by_id,
      account_id: template.account_id,
      is_couple_expense: template.is_couple_expense,
      is_free_spending: template.is_free_spending,
      visibility: template.visibility,
      category: template.category,
      transaction_date: template.start_date,
      installment_group_id: null,
      installment_number: null,
      total_installments: null,
      recurring_template_id: template.id,
    });

    return await this.transactionRepository.create(transaction);
  }

  private buildRecurringDescription(
    baseDescription: string | null,
    template: RecurringTransactionTemplate,
  ): string {
    const frequencyLabel = template.getFrequencyLabel();

    if (!baseDescription) {
      return `Recorrente (${frequencyLabel})`;
    }

    return `${baseDescription} - ${frequencyLabel}`;
  }
}
