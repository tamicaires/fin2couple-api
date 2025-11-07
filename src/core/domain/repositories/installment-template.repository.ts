import { InstallmentTemplate } from '../entities/installment-template.entity';
import { PaginationInput, InstallmentTemplatePaginationOutput } from '@shared/types/pagination.type';

/**
 * Installment Template Repository Interface (Contract)
 *
 * IMPORTANT: All queries MUST filter by couple_id
 */
export interface IInstallmentTemplateRepository {
  /**
   * Find a template by ID
   */
  findById(id: string): Promise<InstallmentTemplate | null>;

  /**
   * Find all templates for a couple
   */
  findByCoupleId(
    coupleId: string,
    pagination?: PaginationInput,
    activeOnly?: boolean,
  ): Promise<InstallmentTemplatePaginationOutput<InstallmentTemplate>>;

  /**
   * Find active templates for a couple
   */
  findActiveByCoupleId(coupleId: string): Promise<InstallmentTemplate[]>;

  /**
   * Create a new template
   */
  create(template: InstallmentTemplate): Promise<InstallmentTemplate>;

  /**
   * Update a template
   */
  update(id: string, data: Partial<InstallmentTemplate>): Promise<InstallmentTemplate>;

  /**
   * Delete a template
   */
  delete(id: string): Promise<void>;

  /**
   * Activate a template
   */
  activate(id: string): Promise<void>;

  /**
   * Deactivate a template
   */
  deactivate(id: string): Promise<void>;

  /**
   * Count active templates for a couple
   */
  countActiveByCoupleId(coupleId: string): Promise<number>;
}
