import { RecurringOccurrence } from '../entities/recurring-occurrence.entity';
import { OccurrenceStatus } from '@core/enum/occurrence-status.enum';

/**
 * Recurring Occurrence Repository Interface (Contract)
 *
 * Manages individual occurrences of recurring transactions
 */
export interface IRecurringOccurrenceRepository {
  /**
   * Find an occurrence by ID
   */
  findById(id: string): Promise<RecurringOccurrence | null>;

  /**
   * Find all occurrences for a template
   */
  findByTemplateId(templateId: string): Promise<RecurringOccurrence[]>;

  /**
   * Find pending occurrences for a template
   */
  findPendingByTemplateId(templateId: string): Promise<RecurringOccurrence[]>;

  /**
   * Find occurrences by status
   */
  findByStatus(
    templateId: string,
    status: OccurrenceStatus,
  ): Promise<RecurringOccurrence[]>;

  /**
   * Find occurrences due within a date range
   */
  findDueOccurrences(startDate: Date, endDate: Date): Promise<RecurringOccurrence[]>;

  /**
   * Find overdue pending occurrences
   */
  findOverdueOccurrences(currentDate?: Date): Promise<RecurringOccurrence[]>;

  /**
   * Find next pending occurrence for a template
   */
  findNextPendingOccurrence(templateId: string): Promise<RecurringOccurrence | null>;

  /**
   * Create a new occurrence
   */
  create(occurrence: RecurringOccurrence): Promise<RecurringOccurrence>;

  /**
   * Create multiple occurrences
   */
  createMany(occurrences: RecurringOccurrence[]): Promise<RecurringOccurrence[]>;

  /**
   * Update an occurrence
   */
  update(id: string, data: Partial<RecurringOccurrence>): Promise<RecurringOccurrence>;

  /**
   * Mark occurrence as paid
   */
  markAsPaid(id: string, transactionId: string): Promise<void>;

  /**
   * Mark occurrence as skipped
   */
  markAsSkipped(id: string): Promise<void>;

  /**
   * Delete an occurrence
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all occurrences for a template
   */
  deleteByTemplateId(templateId: string): Promise<void>;

  /**
   * Count occurrences by status for a template
   */
  countByStatus(templateId: string, status: OccurrenceStatus): Promise<number>;
}
