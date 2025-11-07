import {
  RecurringOccurrence as PrismaRecurringOccurrence,
  OccurrenceStatus as PrismaOccurrenceStatus,
} from '@prisma/client';
import { RecurringOccurrence } from '@core/domain/entities/recurring-occurrence.entity';
import { OccurrenceStatus } from '@core/enum/occurrence-status.enum';

/**
 * Prisma Recurring Occurrence Mapper
 *
 * Converts between Prisma and Domain models
 */
export class PrismaRecurringOccurrenceMapper {
  static toDomain(prismaOccurrence: PrismaRecurringOccurrence): RecurringOccurrence {
    return new RecurringOccurrence({
      id: prismaOccurrence.id,
      template_id: prismaOccurrence.template_id,
      due_date: prismaOccurrence.due_date,
      status: prismaOccurrence.status as OccurrenceStatus,
      transaction_id: prismaOccurrence.transaction_id,
      created_at: prismaOccurrence.created_at,
      updated_at: prismaOccurrence.updated_at,
    });
  }

  static toPrisma(
    occurrence: RecurringOccurrence,
  ): Omit<PrismaRecurringOccurrence, 'created_at' | 'updated_at'> {
    return {
      id: occurrence.id,
      template_id: occurrence.template_id,
      due_date: occurrence.due_date,
      status: occurrence.status as PrismaOccurrenceStatus,
      transaction_id: occurrence.transaction_id,
    };
  }
}
