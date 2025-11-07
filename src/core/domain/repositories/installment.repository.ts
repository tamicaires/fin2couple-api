import { Installment } from '../entities/installment.entity';
import { OccurrenceStatus } from '@core/enum/occurrence-status.enum';

/**
 * Installment Repository Interface (Contract)
 *
 * Manages individual installments of a purchase
 */
export interface IInstallmentRepository {
  /**
   * Find an installment by ID
   */
  findById(id: string): Promise<Installment | null>;

  /**
   * Find all installments for a template
   */
  findByTemplateId(templateId: string): Promise<Installment[]>;

  /**
   * Find pending installments for a template
   */
  findPendingByTemplateId(templateId: string): Promise<Installment[]>;

  /**
   * Find installments by status
   */
  findByStatus(templateId: string, status: OccurrenceStatus): Promise<Installment[]>;

  /**
   * Find installments due within a date range
   */
  findDueInstallments(startDate: Date, endDate: Date): Promise<Installment[]>;

  /**
   * Find overdue pending installments
   */
  findOverdueInstallments(currentDate?: Date): Promise<Installment[]>;

  /**
   * Find next pending installment for a template
   */
  findNextPendingInstallment(templateId: string): Promise<Installment | null>;

  /**
   * Find a specific installment by number
   */
  findByTemplateAndNumber(
    templateId: string,
    installmentNumber: number,
  ): Promise<Installment | null>;

  /**
   * Create a new installment
   */
  create(installment: Installment): Promise<Installment>;

  /**
   * Create multiple installments
   */
  createMany(installments: Installment[]): Promise<Installment[]>;

  /**
   * Update an installment
   */
  update(id: string, data: Partial<Installment>): Promise<Installment>;

  /**
   * Mark installment as paid
   */
  markAsPaid(id: string, transactionId: string): Promise<void>;

  /**
   * Mark installment as skipped
   */
  markAsSkipped(id: string): Promise<void>;

  /**
   * Delete an installment
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all installments for a template
   */
  deleteByTemplateId(templateId: string): Promise<void>;

  /**
   * Count installments by status for a template
   */
  countByStatus(templateId: string, status: OccurrenceStatus): Promise<number>;

  /**
   * Count total installments for a template
   */
  countByTemplateId(templateId: string): Promise<number>;
}
