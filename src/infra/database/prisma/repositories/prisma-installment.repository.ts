import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IInstallmentRepository } from '@core/domain/repositories/installment.repository';
import { Installment } from '@core/domain/entities/installment.entity';
import { PrismaInstallmentMapper } from '../mappers/prisma-installment.mapper';
import { OccurrenceStatus } from '@core/enum/occurrence-status.enum';

@Injectable()
export class PrismaInstallmentRepository implements IInstallmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Installment | null> {
    const installment = await this.prisma.installment.findUnique({
      where: { id },
    });

    return installment ? PrismaInstallmentMapper.toDomain(installment) : null;
  }

  async findByTemplateId(templateId: string): Promise<Installment[]> {
    const installments = await this.prisma.installment.findMany({
      where: { template_id: templateId },
      orderBy: { installment_number: 'asc' },
    });

    return installments.map(PrismaInstallmentMapper.toDomain);
  }

  async findPendingByTemplateId(templateId: string): Promise<Installment[]> {
    const installments = await this.prisma.installment.findMany({
      where: {
        template_id: templateId,
        status: OccurrenceStatus.PENDING,
      },
      orderBy: { installment_number: 'asc' },
    });

    return installments.map(PrismaInstallmentMapper.toDomain);
  }

  async findByStatus(templateId: string, status: OccurrenceStatus): Promise<Installment[]> {
    const installments = await this.prisma.installment.findMany({
      where: {
        template_id: templateId,
        status,
      },
      orderBy: { installment_number: 'asc' },
    });

    return installments.map(PrismaInstallmentMapper.toDomain);
  }

  async findDueInstallments(startDate: Date, endDate: Date): Promise<Installment[]> {
    const installments = await this.prisma.installment.findMany({
      where: {
        status: OccurrenceStatus.PENDING,
        due_date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { due_date: 'asc' },
    });

    return installments.map(PrismaInstallmentMapper.toDomain);
  }

  async findOverdueInstallments(currentDate: Date = new Date()): Promise<Installment[]> {
    const thirtyDaysAgo = new Date(currentDate);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const installments = await this.prisma.installment.findMany({
      where: {
        status: OccurrenceStatus.PENDING,
        due_date: {
          lt: thirtyDaysAgo,
        },
      },
      orderBy: { due_date: 'asc' },
    });

    return installments.map(PrismaInstallmentMapper.toDomain);
  }

  async findNextPendingInstallment(templateId: string): Promise<Installment | null> {
    const installment = await this.prisma.installment.findFirst({
      where: {
        template_id: templateId,
        status: OccurrenceStatus.PENDING,
      },
      orderBy: { installment_number: 'asc' },
    });

    return installment ? PrismaInstallmentMapper.toDomain(installment) : null;
  }

  async findByTemplateAndNumber(
    templateId: string,
    installmentNumber: number,
  ): Promise<Installment | null> {
    const installment = await this.prisma.installment.findUnique({
      where: {
        template_id_installment_number: {
          template_id: templateId,
          installment_number: installmentNumber,
        },
      },
    });

    return installment ? PrismaInstallmentMapper.toDomain(installment) : null;
  }

  async create(installment: Installment): Promise<Installment> {
    const created = await this.prisma.installment.create({
      data: PrismaInstallmentMapper.toPrisma(installment),
    });

    return PrismaInstallmentMapper.toDomain(created);
  }

  async createMany(installments: Installment[]): Promise<Installment[]> {
    const data = installments.map(PrismaInstallmentMapper.toPrisma);

    await this.prisma.installment.createMany({
      data,
    });

    // Prisma createMany doesn't return the created records, so we fetch them
    const templateIds = [...new Set(installments.map((i) => i.template_id))];
    const created = await this.prisma.installment.findMany({
      where: {
        template_id: { in: templateIds },
      },
      orderBy: { created_at: 'desc' },
      take: installments.length,
    });

    return created.map(PrismaInstallmentMapper.toDomain);
  }

  async update(id: string, data: Partial<Installment>): Promise<Installment> {
    const updateData: Record<string, unknown> = {};
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.due_date !== undefined) updateData.due_date = data.due_date;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.transaction_id !== undefined) updateData.transaction_id = data.transaction_id;

    const updated = await this.prisma.installment.update({
      where: { id },
      data: updateData,
    });

    return PrismaInstallmentMapper.toDomain(updated);
  }

  async markAsPaid(id: string, transactionId: string): Promise<void> {
    await this.prisma.installment.update({
      where: { id },
      data: {
        status: OccurrenceStatus.PAID,
        transaction_id: transactionId,
      },
    });
  }

  async markAsSkipped(id: string): Promise<void> {
    await this.prisma.installment.update({
      where: { id },
      data: {
        status: OccurrenceStatus.SKIPPED,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.installment.delete({
      where: { id },
    });
  }

  async deleteByTemplateId(templateId: string): Promise<void> {
    await this.prisma.installment.deleteMany({
      where: { template_id: templateId },
    });
  }

  async countByStatus(templateId: string, status: OccurrenceStatus): Promise<number> {
    return await this.prisma.installment.count({
      where: {
        template_id: templateId,
        status,
      },
    });
  }

  async countByTemplateId(templateId: string): Promise<number> {
    return await this.prisma.installment.count({
      where: {
        template_id: templateId,
      },
    });
  }
}
