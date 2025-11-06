import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaTenantService } from '../prisma-tenant.service';
import { IRecurringTransactionTemplateRepository } from '@core/domain/repositories/recurring-transaction-template.repository';
import { RecurringTransactionTemplate } from '@core/domain/entities/recurring-transaction-template.entity';
import { PrismaRecurringTransactionTemplateMapper } from '../mappers/prisma-recurring-transaction-template.mapper';
import { PaginationInput, PaginationOutput } from '@shared/types/pagination.type';

@Injectable()
export class PrismaRecurringTransactionTemplateRepository
  implements IRecurringTransactionTemplateRepository
{
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: PrismaTenantService,
  ) {}

  async findById(id: string): Promise<RecurringTransactionTemplate | null> {
    const coupleId = this.tenant.getCoupleId();

    const template = await this.prisma.recurringTransactionTemplate.findFirst({
      where: {
        id,
        couple_id: coupleId,
      },
    });

    return template ? PrismaRecurringTransactionTemplateMapper.toDomain(template) : null;
  }

  async findByCoupleId(
    coupleId: string,
    pagination?: PaginationInput,
  ): Promise<PaginationOutput<RecurringTransactionTemplate>> {
    const limit = pagination?.limit || 20;
    const cursor = pagination?.cursor;

    const templates = await this.prisma.recurringTransactionTemplate.findMany({
      where: { couple_id: coupleId },
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { next_occurrence: 'asc' },
    });

    const hasMore = templates.length > limit;
    const data = hasMore ? templates.slice(0, -1) : templates;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    return {
      data: data.map(PrismaRecurringTransactionTemplateMapper.toDomain),
      nextCursor,
      hasMore,
    };
  }

  async findActiveByCoupleId(coupleId: string): Promise<RecurringTransactionTemplate[]> {
    const templates = await this.prisma.recurringTransactionTemplate.findMany({
      where: {
        couple_id: coupleId,
        is_active: true,
      },
      orderBy: { next_occurrence: 'asc' },
    });

    return templates.map(PrismaRecurringTransactionTemplateMapper.toDomain);
  }

  async findDueTemplates(currentDate: Date = new Date()): Promise<RecurringTransactionTemplate[]> {
    const templates = await this.prisma.recurringTransactionTemplate.findMany({
      where: {
        is_active: true,
        next_occurrence: {
          lte: currentDate,
        },
        OR: [
          { end_date: null }, // No end date
          { end_date: { gte: currentDate } }, // End date is in the future
        ],
      },
      orderBy: { next_occurrence: 'asc' },
    });

    return templates.map(PrismaRecurringTransactionTemplateMapper.toDomain);
  }

  async create(template: RecurringTransactionTemplate): Promise<RecurringTransactionTemplate> {
    const created = await this.prisma.recurringTransactionTemplate.create({
      data: PrismaRecurringTransactionTemplateMapper.toPrisma(template),
    });

    return PrismaRecurringTransactionTemplateMapper.toDomain(created);
  }

  async update(
    id: string,
    data: Partial<RecurringTransactionTemplate>,
  ): Promise<RecurringTransactionTemplate> {
    const coupleId = this.tenant.getCoupleId();

    // Only extract updatable fields
    const updateData: Record<string, unknown> = {};
    if (data.type !== undefined) updateData.type = data.type;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.paid_by_id !== undefined) updateData.paid_by_id = data.paid_by_id;
    if (data.account_id !== undefined) updateData.account_id = data.account_id;
    if (data.is_couple_expense !== undefined) updateData.is_couple_expense = data.is_couple_expense;
    if (data.is_free_spending !== undefined) updateData.is_free_spending = data.is_free_spending;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.category !== undefined) updateData.category_id = data.category;
    if (data.frequency !== undefined) updateData.frequency = data.frequency;
    if (data.interval !== undefined) updateData.interval = data.interval;
    if (data.start_date !== undefined) updateData.start_date = data.start_date;
    if (data.end_date !== undefined) updateData.end_date = data.end_date;
    if (data.next_occurrence !== undefined) updateData.next_occurrence = data.next_occurrence;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const updated = await this.prisma.recurringTransactionTemplate.update({
      where: {
        id,
        couple_id: coupleId,
      },
      data: updateData,
    });

    return PrismaRecurringTransactionTemplateMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const coupleId = this.tenant.getCoupleId();

    await this.prisma.recurringTransactionTemplate.delete({
      where: {
        id,
        couple_id: coupleId,
      },
    });
  }

  async activate(id: string): Promise<void> {
    const coupleId = this.tenant.getCoupleId();

    await this.prisma.recurringTransactionTemplate.update({
      where: {
        id,
        couple_id: coupleId,
      },
      data: {
        is_active: true,
      },
    });
  }

  async deactivate(id: string): Promise<void> {
    const coupleId = this.tenant.getCoupleId();

    await this.prisma.recurringTransactionTemplate.update({
      where: {
        id,
        couple_id: coupleId,
      },
      data: {
        is_active: false,
      },
    });
  }

  async updateNextOccurrence(id: string, nextOccurrence: Date): Promise<void> {
    const coupleId = this.tenant.getCoupleId();

    await this.prisma.recurringTransactionTemplate.update({
      where: {
        id,
        couple_id: coupleId,
      },
      data: {
        next_occurrence: nextOccurrence,
      },
    });
  }

  async countActiveByCoupleId(coupleId: string): Promise<number> {
    return await this.prisma.recurringTransactionTemplate.count({
      where: {
        couple_id: coupleId,
        is_active: true,
      },
    });
  }
}
