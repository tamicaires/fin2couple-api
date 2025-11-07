import { Injectable, Inject } from '@nestjs/common';
import { IRecurringOccurrenceRepository } from '@core/domain/repositories/recurring-occurrence.repository';
import { IRecurringTransactionTemplateRepository } from '@core/domain/repositories/recurring-transaction-template.repository';
import { RecurringOccurrence } from '@core/domain/entities/recurring-occurrence.entity';
import { RecurringTransactionTemplate } from '@core/domain/entities/recurring-transaction-template.entity';
import { RecurrenceFrequency } from '@core/enum/recurrence-frequency.enum';

export interface GenerateRecurringOccurrencesInput {
  template_id: string;
  months_ahead?: number; // How many months ahead to generate occurrences (default: 3)
}

export interface GenerateRecurringOccurrencesOutput {
  template: RecurringTransactionTemplate;
  occurrences: RecurringOccurrence[];
}

/**
 * Use Case: Generate Recurring Occurrences
 *
 * Generates future occurrences for a recurring transaction template.
 * Occurrences are individual instances that can be paid or skipped.
 *
 * Business Rules:
 * - Only generates for active templates
 * - Generates up to X months ahead (configurable, default 3)
 * - Respects template end_date if set
 * - Does not regenerate existing occurrences
 * - Uses template's frequency and interval to calculate due dates
 *
 * Design Pattern: Factory Method
 * - Creates multiple occurrence instances from template configuration
 */
@Injectable()
export class GenerateRecurringOccurrencesUseCase {
  constructor(
    @Inject('IRecurringOccurrenceRepository')
    private readonly occurrenceRepository: IRecurringOccurrenceRepository,
    @Inject('IRecurringTransactionTemplateRepository')
    private readonly templateRepository: IRecurringTransactionTemplateRepository,
  ) {}

  async execute(input: GenerateRecurringOccurrencesInput): Promise<GenerateRecurringOccurrencesOutput> {
    const monthsAhead = input.months_ahead || 3;

    // Get template
    const template = await this.templateRepository.findById(input.template_id);
    if (!template) {
      throw new Error('Template not found');
    }

    if (!template.is_active) {
      throw new Error('Cannot generate occurrences for inactive template');
    }

    // Get existing occurrences to avoid duplicates
    const existingOccurrences = await this.occurrenceRepository.findByTemplateId(template.id);
    const existingDates = new Set(
      existingOccurrences.map((o) => o.due_date.toISOString().split('T')[0]),
    );

    // Calculate end date for generation
    const endDate = this.calculateEndDate(template, monthsAhead);

    // Generate new occurrences
    const occurrences: RecurringOccurrence[] = [];
    let currentDate = new Date(template.next_occurrence);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];

      // Only create if doesn't already exist
      if (!existingDates.has(dateKey)) {
        const occurrence = RecurringOccurrence.create({
          template_id: template.id,
          due_date: new Date(currentDate),
        });
        occurrences.push(occurrence);
      }

      // Calculate next occurrence date
      currentDate = this.calculateNextDate(currentDate, template.frequency, template.interval);

      // Stop if we've reached template end date
      if (template.end_date && currentDate > template.end_date) {
        break;
      }
    }

    // Save occurrences
    const createdOccurrences =
      occurrences.length > 0 ? await this.occurrenceRepository.createMany(occurrences) : [];

    return {
      template,
      occurrences: createdOccurrences,
    };
  }

  private calculateEndDate(template: RecurringTransactionTemplate, monthsAhead: number): Date {
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + monthsAhead);

    // If template has an end date, use the earlier of the two
    if (template.end_date && template.end_date < endDate) {
      return template.end_date;
    }

    return endDate;
  }

  private calculateNextDate(currentDate: Date, frequency: RecurrenceFrequency, interval: number): Date {
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
}
