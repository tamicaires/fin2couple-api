import { Injectable, Inject, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { IRecurringTransactionTemplateRepository } from '@core/domain/repositories/recurring-transaction-template.repository';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { RecurringTransactionTemplate } from '@core/domain/entities/recurring-transaction-template.entity';

export interface GenerateRecurringTransactionsOutput {
  generated_count: number;
  templates_processed: number;
  failed_templates: Array<{ template_id: string; error: string }>;
}

/**
 * Use Case: Generate Recurring Transactions
 *
 * Scheduled job that runs daily to generate transactions from active templates
 * whose next_occurrence date has been reached.
 *
 * Design Pattern: Template Method Pattern
 * - Defines skeleton of algorithm for generating recurring transactions
 * - processTemplate() can be overridden for custom behavior
 *
 * Business Rules:
 * - Runs daily at midnight
 * - Only processes active templates
 * - Only generates if next_occurrence <= current date
 * - Updates next_occurrence after generating
 * - Deactivates templates that have ended
 */
@Injectable()
export class GenerateRecurringTransactionsUseCase {
  private readonly logger = new Logger(GenerateRecurringTransactionsUseCase.name);

  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('IRecurringTransactionTemplateRepository')
    private readonly templateRepository: IRecurringTransactionTemplateRepository,
  ) {}

  /**
   * Scheduled Job: Runs daily at midnight
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCron(): Promise<void> {
    this.logger.log('Starting recurring transactions generation job');

    try {
      const result = await this.execute();
      this.logger.log(
        `Job completed. Generated: ${result.generated_count}, Processed: ${result.templates_processed}, Failed: ${result.failed_templates.length}`,
      );

      if (result.failed_templates.length > 0) {
        this.logger.warn('Failed templates:', result.failed_templates);
      }
    } catch (error) {
      this.logger.error('Job failed with error:', error);
    }
  }

  /**
   * Manual execution (can be called from API endpoint for testing)
   */
  async execute(currentDate: Date = new Date()): Promise<GenerateRecurringTransactionsOutput> {
    const result: GenerateRecurringTransactionsOutput = {
      generated_count: 0,
      templates_processed: 0,
      failed_templates: [],
    };

    // Find all templates that are due
    const dueTemplates = await this.templateRepository.findDueTemplates(currentDate);

    this.logger.debug(`Found ${dueTemplates.length} due templates`);

    // Process each template
    for (const template of dueTemplates) {
      try {
        const generated = await this.processTemplate(template, currentDate);

        if (generated) {
          result.generated_count++;
        }

        result.templates_processed++;
      } catch (error) {
        this.logger.error(`Failed to process template ${template.id}:`, error);
        result.failed_templates.push({
          template_id: template.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return result;
  }

  /**
   * Template Method: Process a single template
   * Can be overridden for custom behavior
   */
  private async processTemplate(
    template: RecurringTransactionTemplate,
    currentDate: Date,
  ): Promise<boolean> {
    // Check if template has ended
    if (template.hasEnded(currentDate)) {
      this.logger.debug(`Template ${template.id} has ended, deactivating`);
      await this.templateRepository.deactivate(template.id);
      return false;
    }

    // Check if should generate (double-check)
    if (!template.shouldGenerateTransaction(currentDate)) {
      this.logger.debug(`Template ${template.id} should not generate yet`);
      return false;
    }

    // Create transaction from template (Factory Method)
    const transaction = this.createTransactionFromTemplate(template);

    // Save transaction
    await this.transactionRepository.create(transaction);

    this.logger.debug(`Generated transaction for template ${template.id}`);

    // Update next occurrence
    template.updateNextOccurrence();
    await this.templateRepository.updateNextOccurrence(template.id, template.next_occurrence);

    return true;
  }

  /**
   * Factory Method: Creates a transaction from a template
   */
  private createTransactionFromTemplate(template: RecurringTransactionTemplate): Transaction {
    return new Transaction({
      couple_id: template.couple_id,
      type: template.type,
      amount: template.amount,
      description: this.buildRecurringDescription(template),
      paid_by_id: template.paid_by_id,
      account_id: template.account_id,
      is_couple_expense: template.is_couple_expense,
      is_free_spending: template.is_free_spending,
      visibility: template.visibility,
      category: template.category,
      transaction_date: template.next_occurrence,
      installment_group_id: null,
      installment_number: null,
      total_installments: null,
      recurring_template_id: template.id,
    });
  }

  private buildRecurringDescription(template: RecurringTransactionTemplate): string {
    const frequencyLabel = template.getFrequencyLabel();

    if (!template.description) {
      return `Recorrente (${frequencyLabel})`;
    }

    return `${template.description} - ${frequencyLabel}`;
  }
}
