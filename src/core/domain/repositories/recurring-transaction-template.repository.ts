import { RecurringTransactionTemplate } from '../entities/recurring-transaction-template.entity';
import { PaginationInput, PaginationOutput } from '@shared/types/pagination.type';

/**
 * Recurring Transaction Template Repository Interface (Contract)
 *
 * IMPORTANT: All queries MUST filter by couple_id
 */
export interface IRecurringTransactionTemplateRepository {
  /**
   * Find a template by ID
   */
  findById(id: string): Promise<RecurringTransactionTemplate | null>;

  /**
   * Find all templates for a couple
   */
  findByCoupleId(
    coupleId: string,
    pagination?: PaginationInput,
  ): Promise<PaginationOutput<RecurringTransactionTemplate>>;

  /**
   * Find active templates for a couple
   */
  findActiveByCoupleId(coupleId: string): Promise<RecurringTransactionTemplate[]>;

  /**
   * Find templates that should generate transactions
   * (active templates where next_occurrence <= currentDate)
   */
  findDueTemplates(currentDate?: Date): Promise<RecurringTransactionTemplate[]>;

  /**
   * Create a new template
   */
  create(template: RecurringTransactionTemplate): Promise<RecurringTransactionTemplate>;

  /**
   * Update a template
   */
  update(id: string, data: Partial<RecurringTransactionTemplate>): Promise<RecurringTransactionTemplate>;

  /**
   * Delete a template
   */
  delete(id: string): Promise<void>;

  /**
   * Activate a template
   */
  activate(id: string): Promise<void>;

  /**
   * Deactivate/pause a template
   */
  deactivate(id: string): Promise<void>;

  /**
   * Update the next occurrence date for a template
   */
  updateNextOccurrence(id: string, nextOccurrence: Date): Promise<void>;

  /**
   * Count active templates for a couple
   */
  countActiveByCoupleId(coupleId: string): Promise<number>;
}
