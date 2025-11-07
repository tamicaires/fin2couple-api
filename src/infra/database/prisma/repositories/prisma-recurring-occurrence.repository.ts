import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IRecurringOccurrenceRepository } from '@core/domain/repositories/recurring-occurrence.repository';
import { RecurringOccurrence } from '@core/domain/entities/recurring-occurrence.entity';
import { PrismaRecurringOccurrenceMapper } from '../mappers/prisma-recurring-occurrence.mapper';
import { OccurrenceStatus } from '@core/enum/occurrence-status.enum';

@Injectable()
export class PrismaRecurringOccurrenceRepository implements IRecurringOccurrenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<RecurringOccurrence | null> {
    const occurrence = await this.prisma.recurringOccurrence.findUnique({
      where: { id },
    });

    return occurrence ? PrismaRecurringOccurrenceMapper.toDomain(occurrence) : null;
  }

  async findByTemplateId(templateId: string): Promise<RecurringOccurrence[]> {
    const occurrences = await this.prisma.recurringOccurrence.findMany({
      where: { template_id: templateId },
      orderBy: { due_date: 'asc' },
    });

    return occurrences.map(PrismaRecurringOccurrenceMapper.toDomain);
  }

  async findPendingByTemplateId(templateId: string): Promise<RecurringOccurrence[]> {
    const occurrences = await this.prisma.recurringOccurrence.findMany({
      where: {
        template_id: templateId,
        status: OccurrenceStatus.PENDING,
      },
      orderBy: { due_date: 'asc' },
    });

    return occurrences.map(PrismaRecurringOccurrenceMapper.toDomain);
  }

  async findByStatus(
    templateId: string,
    status: OccurrenceStatus,
  ): Promise<RecurringOccurrence[]> {
    const occurrences = await this.prisma.recurringOccurrence.findMany({
      where: {
        template_id: templateId,
        status,
      },
      orderBy: { due_date: 'asc' },
    });

    return occurrences.map(PrismaRecurringOccurrenceMapper.toDomain);
  }

  async findDueOccurrences(startDate: Date, endDate: Date): Promise<RecurringOccurrence[]> {
    const occurrences = await this.prisma.recurringOccurrence.findMany({
      where: {
        status: OccurrenceStatus.PENDING,
        due_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { due_date: 'asc' },
    });

    return occurrences.map(PrismaRecurringOccurrenceMapper.toDomain);
  }

  async findOverdueOccurrences(currentDate: Date = new Date()): Promise<RecurringOccurrence[]> {
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const occurrences = await this.prisma.recurringOccurrence.findMany({
      where: {
        status: OccurrenceStatus.PENDING,
        due_date: {
          lt: thirtyDaysAgo,
        },
      },
      orderBy: { due_date: 'asc' },
    });

    return occurrences.map(PrismaRecurringOccurrenceMapper.toDomain);
  }

  async findNextPendingOccurrence(templateId: string): Promise<RecurringOccurrence | null> {
    const occurrence = await this.prisma.recurringOccurrence.findFirst({
      where: {
        template_id: templateId,
        status: OccurrenceStatus.PENDING,
      },
      orderBy: { due_date: 'asc' },
    });

    return occurrence ? PrismaRecurringOccurrenceMapper.toDomain(occurrence) : null;
  }

  async create(occurrence: RecurringOccurrence): Promise<RecurringOccurrence> {
    const created = await this.prisma.recurringOccurrence.create({
      data: PrismaRecurringOccurrenceMapper.toPrisma(occurrence),
    });

    return PrismaRecurringOccurrenceMapper.toDomain(created);
  }

  async createMany(occurrences: RecurringOccurrence[]): Promise<RecurringOccurrence[]> {
    const data = occurrences.map(PrismaRecurringOccurrenceMapper.toPrisma);

    await this.prisma.recurringOccurrence.createMany({
      data,
    });

    // Prisma createMany doesn't return the created records, so we fetch them
    const templateIds = [...new Set(occurrences.map((o) => o.template_id))];
    const created = await this.prisma.recurringOccurrence.findMany({
      where: {
        template_id: { in: templateIds },
      },
      orderBy: { created_at: 'desc' },
      take: occurrences.length,
    });

    return created.map(PrismaRecurringOccurrenceMapper.toDomain);
  }

  async update(id: string, data: Partial<RecurringOccurrence>): Promise<RecurringOccurrence> {
    const updateData: Record<string, unknown> = {};
    if (data.due_date !== undefined) updateData.due_date = data.due_date;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.transaction_id !== undefined) updateData.transaction_id = data.transaction_id;

    const updated = await this.prisma.recurringOccurrence.update({
      where: { id },
      data: updateData,
    });

    return PrismaRecurringOccurrenceMapper.toDomain(updated);
  }

  async markAsPaid(id: string, transactionId: string): Promise<void> {
    await this.prisma.recurringOccurrence.update({
      where: { id },
      data: {
        status: OccurrenceStatus.PAID,
        transaction_id: transactionId,
      },
    });
  }

  async markAsSkipped(id: string): Promise<void> {
    await this.prisma.recurringOccurrence.update({
      where: { id },
      data: {
        status: OccurrenceStatus.SKIPPED,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.recurringOccurrence.delete({
      where: { id },
    });
  }

  async deleteByTemplateId(templateId: string): Promise<void> {
    await this.prisma.recurringOccurrence.deleteMany({
      where: { template_id: templateId },
    });
  }

  async countByStatus(templateId: string, status: OccurrenceStatus): Promise<number> {
    return await this.prisma.recurringOccurrence.count({
      where: {
        template_id: templateId,
        status,
      },
    });
  }
}
