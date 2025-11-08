import { Injectable, Inject } from '@nestjs/common';
import { IRecurringTransactionTemplateRepository } from '@core/domain/repositories/recurring-transaction-template.repository';
import { IRecurringOccurrenceRepository } from '@core/domain/repositories/recurring-occurrence.repository';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { RecurringTransactionTemplate } from '@core/domain/entities/recurring-transaction-template.entity';
import { RecurringOccurrence } from '@core/domain/entities/recurring-occurrence.entity';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { TransactionType } from '@core/enum/transaction-type.enum';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';
import { RecurrenceFrequency } from '@core/enum/recurrence-frequency.enum';
import { RecurrenceConfig } from '@core/domain/value-objects/recurrence-config.vo';
import { AccountNotFoundException } from '@core/exceptions/account/account-not-found.exception';

export interface CreateRecurringTransactionInput {
  couple_id: string;
  type: TransactionType;
  amount: number;
  description: string | null;
  paid_by_id: string;
  account_id: string;
  is_couple_expense: boolean;
  is_free_spending: boolean;
  visibility?: TransactionVisibility;
  category: string | null;

  // Recurrence configuration
  frequency: RecurrenceFrequency;
  interval: number;
  start_date: Date;
  end_date: Date | null;
  create_first_transaction: boolean;
  months_ahead?: number;
}

export interface CreateRecurringTransactionOutput {
  template: RecurringTransactionTemplate;
  occurrences: RecurringOccurrence[];
  first_transaction: Transaction | null;
}

@Injectable()
export class CreateRecurringTransactionUseCase {
  constructor(
    @Inject('IRecurringTransactionTemplateRepository')
    private readonly templateRepository: IRecurringTransactionTemplateRepository,
    @Inject('IRecurringOccurrenceRepository')
    private readonly occurrenceRepository: IRecurringOccurrenceRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('IAccountRepository')
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(input: CreateRecurringTransactionInput): Promise<CreateRecurringTransactionOutput> {
    this.validateInput(input);

    const account = await this.accountRepository.findById(input.account_id);
    if (!account) {
      throw new AccountNotFoundException(input.account_id);
    }

    const visibility = input.visibility ?? (account.owner_id ? 'PRIVATE' : 'SHARED');

    const recurrenceConfig = RecurrenceConfig.create(
      input.frequency,
      input.interval,
      input.start_date,
      input.end_date,
    );

    const template = this.createTemplate(input, recurrenceConfig, visibility);
    const createdTemplate = await this.templateRepository.create(template);

    const monthsAhead = input.months_ahead || 3;
    const occurrences = await this.generateOccurrences(createdTemplate, monthsAhead);

    let firstTransaction: Transaction | null = null;
    if (input.create_first_transaction && occurrences.length > 0) {
      const firstOccurrence = occurrences[0];
      firstTransaction = await this.createFirstTransaction(createdTemplate, firstOccurrence);
      firstOccurrence.markAsPaid(firstTransaction.id);
      await this.occurrenceRepository.markAsPaid(firstOccurrence.id, firstTransaction.id);
    }

    return {
      template: createdTemplate,
      occurrences,
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
    visibility: TransactionVisibility,
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
      visibility,
      category: input.category,
      frequency: recurrenceConfig.frequency,
      interval: recurrenceConfig.interval,
      start_date: recurrenceConfig.startDate,
      end_date: recurrenceConfig.endDate,
      next_occurrence: recurrenceConfig.startDate,
      is_active: true,
    });
  }

  private async generateOccurrences(
    template: RecurringTransactionTemplate,
    monthsAhead: number,
  ): Promise<RecurringOccurrence[]> {
    const occurrences: RecurringOccurrence[] = [];
    const endDate = this.calculateEndDate(template, monthsAhead);
    let currentDate = new Date(template.next_occurrence);

    while (currentDate <= endDate) {
      const occurrence = RecurringOccurrence.create({
        template_id: template.id,
        due_date: new Date(currentDate),
      });
      occurrences.push(occurrence);

      currentDate = this.calculateNextDate(currentDate, template.frequency, template.interval);

      if (template.end_date && currentDate > template.end_date) {
        break;
      }
    }

    return occurrences.length > 0 ? await this.occurrenceRepository.createMany(occurrences) : [];
  }

  private calculateEndDate(template: RecurringTransactionTemplate, monthsAhead: number): Date {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsAhead);
    if (template.end_date && template.end_date < endDate) {
      return template.end_date;
    }
    return endDate;
  }

  private calculateNextDate(
    currentDate: Date,
    frequency: RecurrenceFrequency,
    interval: number,
  ): Date {
    const nextDate = new Date(currentDate);
    switch (frequency) {
      case RecurrenceFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + interval);
        break;
      case RecurrenceFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + interval * 7);
        break;
      case RecurrenceFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + interval);
        break;
      case RecurrenceFrequency.YEARLY:
        nextDate.setFullYear(nextDate.getFullYear() + interval);
        break;
      default:
        throw new Error(`Unsupported frequency: ${frequency}`);
    }
    return nextDate;
  }

  private async createFirstTransaction(
    template: RecurringTransactionTemplate,
    occurrence: RecurringOccurrence,
  ): Promise<Transaction> {
    const transaction = new Transaction({
      couple_id: template.couple_id,
      type: template.type,
      amount: template.amount,
      description: this.buildRecurringDescription(template.description, occurrence.due_date),
      paid_by_id: template.paid_by_id,
      account_id: template.account_id,
      is_couple_expense: template.is_couple_expense,
      is_free_spending: template.is_free_spending,
      visibility: template.visibility,
      category: template.category,
      transaction_date: occurrence.due_date,
      installment_group_id: null,
      installment_number: null,
      total_installments: null,
      recurring_template_id: template.id,
    });
    return await this.transactionRepository.create(transaction);
  }

  private buildRecurringDescription(baseDescription: string | null, dueDate: Date): string {
    const monthYear = dueDate.toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });
    if (!baseDescription) {
      return `Recorrente - ${monthYear}`;
    }
    return `${baseDescription} - ${monthYear}`;
  }
}
