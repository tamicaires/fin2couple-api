import { Injectable, Inject } from '@nestjs/common';
import { IRecurringOccurrenceRepository } from '@core/domain/repositories/recurring-occurrence.repository';
import { IRecurringTransactionTemplateRepository } from '@core/domain/repositories/recurring-transaction-template.repository';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { RecurringOccurrence } from '@core/domain/entities/recurring-occurrence.entity';
import { Transaction } from '@core/domain/entities/transaction.entity';

export interface PayRecurringOccurrenceInput {
  occurrence_id: string;
  transaction_date?: Date; // Optional custom transaction date (defaults to occurrence due_date)
}

export interface PayRecurringOccurrenceOutput {
  occurrence: RecurringOccurrence;
  transaction: Transaction;
}

/**
 * Use Case: Pay Recurring Occurrence
 *
 * Marks an occurrence as paid by creating the actual transaction.
 * This is the bridge between scheduled occurrences and actual transactions.
 *
 * Business Rules:
 * - Only pending occurrences can be paid
 * - Cannot pay overdue occurrences (>30 days past due)
 * - Creates transaction with template's configuration
 * - Links transaction to occurrence
 * - Marks occurrence as PAID
 *
 * Design Pattern: Factory Method + Command
 * - Factory: Creates transaction from template
 * - Command: Executes the payment action
 */
@Injectable()
export class PayRecurringOccurrenceUseCase {
  constructor(
    @Inject('IRecurringOccurrenceRepository')
    private readonly occurrenceRepository: IRecurringOccurrenceRepository,
    @Inject('IRecurringTransactionTemplateRepository')
    private readonly templateRepository: IRecurringTransactionTemplateRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(input: PayRecurringOccurrenceInput): Promise<PayRecurringOccurrenceOutput> {
    // Get occurrence
    const occurrence = await this.occurrenceRepository.findById(input.occurrence_id);
    if (!occurrence) {
      throw new Error('Occurrence not found');
    }

    // Validate can be paid
    if (!occurrence.canBePaid()) {
      if (occurrence.isPaid()) {
        throw new Error('Occurrence is already paid');
      }
      if (occurrence.isSkipped()) {
        throw new Error('Cannot pay skipped occurrence');
      }
      if (occurrence.isOverdue()) {
        throw new Error('Cannot pay overdue occurrence (>30 days past due)');
      }
      throw new Error('Occurrence cannot be paid');
    }

    // Get template to create transaction
    const template = await this.templateRepository.findById(occurrence.template_id);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create transaction from template
    const transactionDate = input.transaction_date || occurrence.due_date;
    const transaction = await this.createTransactionFromTemplate(
      template,
      occurrence,
      transactionDate,
    );

    // Mark occurrence as paid
    occurrence.markAsPaid(transaction.id);
    await this.occurrenceRepository.markAsPaid(occurrence.id, transaction.id);

    return {
      occurrence,
      transaction,
    };
  }

  /**
   * Factory Method: Creates a transaction from template and occurrence
   */
  private async createTransactionFromTemplate(
    template: any,
    occurrence: RecurringOccurrence,
    transactionDate: Date,
  ): Promise<Transaction> {
    const transaction = new Transaction({
      couple_id: template.couple_id,
      type: template.type,
      amount: template.amount,
      description: this.buildDescription(template.description, occurrence.due_date),
      paid_by_id: template.paid_by_id,
      account_id: template.account_id,
      is_couple_expense: template.is_couple_expense,
      is_free_spending: template.is_free_spending,
      visibility: template.visibility,
      category: template.category,
      transaction_date: transactionDate,
      installment_group_id: null,
      installment_number: null,
      total_installments: null,
      recurring_template_id: template.id,
    });

    return await this.transactionRepository.create(transaction);
  }

  private buildDescription(baseDescription: string | null, dueDate: Date): string {
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
