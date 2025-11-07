import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaTenantService } from '../prisma-tenant.service';
import { IInstallmentTemplateRepository } from '@core/domain/repositories/installment-template.repository';
import { InstallmentTemplate } from '@core/domain/entities/installment-template.entity';
import { PrismaInstallmentTemplateMapper } from '../mappers/prisma-installment-template.mapper';
import { PaginationInput, InstallmentTemplatePaginationOutput } from '@shared/types/pagination.type';

@Injectable()
export class PrismaInstallmentTemplateRepository implements IInstallmentTemplateRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: PrismaTenantService,
  ) {}

  async findById(id: string): Promise<InstallmentTemplate | null> {
    const coupleId = this.tenant.getCoupleId();

    const template = await this.prisma.installmentTemplate.findFirst({
      where: {
        id,
        couple_id: coupleId,
      },
    });

    return template ? PrismaInstallmentTemplateMapper.toDomain(template) : null;
  }

  async findByCoupleId(
    coupleId: string,
    pagination?: PaginationInput,
    activeOnly?: boolean,
  ): Promise<InstallmentTemplatePaginationOutput<InstallmentTemplate>> {
    const limit = pagination?.limit || 20;
    const cursor = pagination?.cursor;

    // Default to active only if not specified
    const shouldFilterActive = activeOnly !== undefined ? activeOnly : true;

    const where: Record<string, unknown> = { couple_id: coupleId };
    // Only filter by is_active if shouldFilterActive is true
    // If false, don't add any is_active filter (returns all)
    if (shouldFilterActive === true) {
      where.is_active = true;
    }

    const templates = await this.prisma.installmentTemplate.findMany({
      where,
      take: limit + 1,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { first_due_date: 'asc' },
    });

    const hasMore = templates.length > limit;
    const data = hasMore ? templates.slice(0, -1) : templates;
    const nextCursor = hasMore ? data[data.length - 1].id : null;

    // Always check if there are inactive templates (for the toggle button)
    const inactiveCount = await this.prisma.installmentTemplate.count({
      where: {
        couple_id: coupleId,
        is_active: false,
      },
    });
    const hasInactiveTemplates = inactiveCount > 0;

    return {
      data: data.map(PrismaInstallmentTemplateMapper.toDomain),
      nextCursor,
      hasMore,
      hasInactiveTemplates,
    };
  }

  async findActiveByCoupleId(coupleId: string): Promise<InstallmentTemplate[]> {
    const templates = await this.prisma.installmentTemplate.findMany({
      where: {
        couple_id: coupleId,
        is_active: true,
      },
      orderBy: { first_due_date: 'asc' },
    });

    return templates.map(PrismaInstallmentTemplateMapper.toDomain);
  }

  async create(template: InstallmentTemplate): Promise<InstallmentTemplate> {
    const created = await this.prisma.installmentTemplate.create({
      data: PrismaInstallmentTemplateMapper.toPrisma(template),
    });

    return PrismaInstallmentTemplateMapper.toDomain(created);
  }

  async update(
    id: string,
    data: Partial<InstallmentTemplate>,
  ): Promise<InstallmentTemplate> {
    const coupleId = this.tenant.getCoupleId();

    const updateData: Record<string, unknown> = {};
    if (data.description !== undefined) updateData.description = data.description;
    if (data.total_amount !== undefined) updateData.total_amount = data.total_amount;
    if (data.total_installments !== undefined)
      updateData.total_installments = data.total_installments;
    if (data.paid_by_id !== undefined) updateData.paid_by_id = data.paid_by_id;
    if (data.account_id !== undefined) updateData.account_id = data.account_id;
    if (data.category_id !== undefined) updateData.category_id = data.category_id;
    if (data.is_couple_expense !== undefined)
      updateData.is_couple_expense = data.is_couple_expense;
    if (data.is_free_spending !== undefined)
      updateData.is_free_spending = data.is_free_spending;
    if (data.visibility !== undefined) updateData.visibility = data.visibility;
    if (data.first_due_date !== undefined) updateData.first_due_date = data.first_due_date;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const updated = await this.prisma.installmentTemplate.update({
      where: {
        id,
        couple_id: coupleId,
      },
      data: updateData,
    });

    return PrismaInstallmentTemplateMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const coupleId = this.tenant.getCoupleId();

    await this.prisma.installmentTemplate.delete({
      where: {
        id,
        couple_id: coupleId,
      },
    });
  }

  async activate(id: string): Promise<void> {
    const coupleId = this.tenant.getCoupleId();

    await this.prisma.installmentTemplate.update({
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

    await this.prisma.installmentTemplate.update({
      where: {
        id,
        couple_id: coupleId,
      },
      data: {
        is_active: false,
      },
    });
  }

  async countActiveByCoupleId(coupleId: string): Promise<number> {
    return await this.prisma.installmentTemplate.count({
      where: {
        couple_id: coupleId,
        is_active: true,
      },
    });
  }
}
