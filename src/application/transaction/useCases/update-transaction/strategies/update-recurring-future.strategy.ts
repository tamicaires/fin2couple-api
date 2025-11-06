import { Injectable, Inject } from '@nestjs/common';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { IRecurringTransactionTemplateRepository } from '@core/domain/repositories/recurring-transaction-template.repository';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { RecurringTransactionTemplate } from '@core/domain/entities/recurring-transaction-template.entity';
import { IUpdateTransactionStrategy } from './update-strategy.interface';

/**
 * Strategy: Update Recurring Template (Future Occurrences)
 *
 * Updates the recurring template so all future transactions will have the new values.
 * The current transaction is detached from the template and updated independently.
 */
@Injectable()
export class UpdateRecurringFutureStrategy implements IUpdateTransactionStrategy {
  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('IRecurringTransactionTemplateRepository')
    private readonly templateRepository: IRecurringTransactionTemplateRepository,
  ) {}

  async execute(transactionId: string, updateData: Partial<Transaction>): Promise<Transaction[]> {
    // Get the current transaction
    const currentTransaction = await this.transactionRepository.findById(transactionId);

    if (!currentTransaction) {
      throw new Error('Transaction not found');
    }

    if (!currentTransaction.isRecurring()) {
      throw new Error('Transaction is not part of a recurring template');
    }

    const { recurring_template_id } = currentTransaction;

    if (!recurring_template_id) {
      throw new Error('Recurring template ID not found');
    }

    // Get the template
    const template = await this.templateRepository.findById(recurring_template_id);

    if (!template) {
      throw new Error('Recurring template not found');
    }

    // Detach current transaction from template (so it's independent now)
    const detachedTransaction = await this.transactionRepository.update(transactionId, {
      ...updateData,
      recurring_template_id: null, // Detach from template
    });

    // Update the template with new values (affects future transactions)
    const templateUpdateData: Partial<RecurringTransactionTemplate> = {};
    if (updateData.type !== undefined) templateUpdateData.type = updateData.type;
    if (updateData.amount !== undefined) templateUpdateData.amount = updateData.amount;
    if (updateData.description !== undefined) templateUpdateData.description = updateData.description;
    if (updateData.paid_by_id !== undefined) templateUpdateData.paid_by_id = updateData.paid_by_id;
    if (updateData.account_id !== undefined) templateUpdateData.account_id = updateData.account_id;
    if (updateData.is_couple_expense !== undefined)
      templateUpdateData.is_couple_expense = updateData.is_couple_expense;
    if (updateData.is_free_spending !== undefined)
      templateUpdateData.is_free_spending = updateData.is_free_spending;
    if (updateData.visibility !== undefined) templateUpdateData.visibility = updateData.visibility;
    if (updateData.category !== undefined) templateUpdateData.category = updateData.category;

    await this.templateRepository.update(recurring_template_id, templateUpdateData);

    return [detachedTransaction];
  }
}
