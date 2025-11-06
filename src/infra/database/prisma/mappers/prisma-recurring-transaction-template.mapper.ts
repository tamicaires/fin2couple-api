import {
  RecurringTransactionTemplate as PrismaRecurringTemplate,
  TransactionType as PrismaTransactionType,
  TransactionVisibility as PrismaTransactionVisibility,
  RecurrenceFrequency as PrismaRecurrenceFrequency,
  Prisma,
} from '@prisma/client';
import { RecurringTransactionTemplate } from '@core/domain/entities/recurring-transaction-template.entity';
import { TransactionType } from '@core/enum/transaction-type.enum';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';
import { RecurrenceFrequency } from '@core/enum/recurrence-frequency.enum';

/**
 * Prisma Recurring Transaction Template Mapper
 *
 * Converts Prisma Decimal to number for amount
 */
export class PrismaRecurringTransactionTemplateMapper {
  static toDomain(prismaTemplate: PrismaRecurringTemplate): RecurringTransactionTemplate {
    return new RecurringTransactionTemplate({
      id: prismaTemplate.id,
      couple_id: prismaTemplate.couple_id,
      type: prismaTemplate.type as TransactionType,
      amount: Number(prismaTemplate.amount),
      description: prismaTemplate.description,
      paid_by_id: prismaTemplate.paid_by_id,
      account_id: prismaTemplate.account_id,
      is_couple_expense: prismaTemplate.is_couple_expense,
      is_free_spending: prismaTemplate.is_free_spending,
      visibility: prismaTemplate.visibility as TransactionVisibility,
      category: prismaTemplate.category_id,
      frequency: prismaTemplate.frequency as RecurrenceFrequency,
      interval: prismaTemplate.interval,
      start_date: prismaTemplate.start_date,
      end_date: prismaTemplate.end_date,
      next_occurrence: prismaTemplate.next_occurrence,
      is_active: prismaTemplate.is_active,
      created_at: prismaTemplate.created_at,
      updated_at: prismaTemplate.updated_at,
    });
  }

  static toPrisma(
    template: RecurringTransactionTemplate,
  ): Omit<PrismaRecurringTemplate, 'created_at' | 'updated_at'> {
    return {
      id: template.id,
      couple_id: template.couple_id,
      type: template.type as PrismaTransactionType,
      amount: new Prisma.Decimal(template.amount),
      description: template.description,
      paid_by_id: template.paid_by_id,
      account_id: template.account_id,
      is_couple_expense: template.is_couple_expense,
      is_free_spending: template.is_free_spending,
      visibility: template.visibility as PrismaTransactionVisibility,
      category_id: template.category,
      frequency: template.frequency as PrismaRecurrenceFrequency,
      interval: template.interval,
      start_date: template.start_date,
      end_date: template.end_date,
      next_occurrence: template.next_occurrence,
      is_active: template.is_active,
    };
  }
}
