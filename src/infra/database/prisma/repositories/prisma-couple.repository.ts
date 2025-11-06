import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { Couple } from '@core/domain/entities/couple.entity';
import { PrismaCoupleMapper } from '../mappers/prisma-couple.mapper';
import { FinancialModel } from '@prisma/client';

/**
 * Prisma Couple Repository
 *
 * CRITICAL: This is the Tenant repository for multi-tenancy
 */
@Injectable()
export class PrismaCoupleRepository implements ICoupleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Couple | null> {
    const couple = await this.prisma.couple.findUnique({
      where: { id },
    });

    return couple ? PrismaCoupleMapper.toDomain(couple) : null;
  }

  async findByUserId(userId: string): Promise<Couple | null> {
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [
          { user_id_a: userId },
          { user_id_b: userId },
        ],
      },
    });

    return couple ? PrismaCoupleMapper.toDomain(couple) : null;
  }

  async findAll(): Promise<Couple[]> {
    const couples = await this.prisma.couple.findMany();
    return couples.map(PrismaCoupleMapper.toDomain);
  }

  async create(couple: Couple): Promise<Couple> {
    const created = await this.prisma.couple.create({
      data: PrismaCoupleMapper.toPrisma(couple),
    });

    return PrismaCoupleMapper.toDomain(created);
  }

  async update(id: string, data: Partial<Couple>): Promise<Couple> {
    const updated = await this.prisma.couple.update({
      where: { id },
      data,
    });

    return PrismaCoupleMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.couple.delete({
      where: { id },
    });
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.prisma.couple.count({
      where: {
        OR: [
          { user_id_a: userId },
          { user_id_b: userId },
        ],
      },
    });

    return count > 0;
  }

  async findCouplesNeedingReset(today: Date): Promise<Couple[]> {
    const dayOfMonth = today.getDate();

    const couples = await this.prisma.couple.findMany({
      where: {
        reset_day: dayOfMonth,
      },
    });

    return couples.map(PrismaCoupleMapper.toDomain);
  }

  async updateFreeSpending(
    coupleId: string,
    userId: string,
    newMonthlyAmount: number,
    newRemainingAmount: number,
  ): Promise<void> {
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
    });

    if (!couple) return;

    const isUserA = couple.user_id_a === userId;

    await this.prisma.couple.update({
      where: { id: coupleId },
      data: isUserA
        ? {
            free_spending_a_monthly: newMonthlyAmount,
            free_spending_a_remaining: newRemainingAmount,
          }
        : {
            free_spending_b_monthly: newMonthlyAmount,
            free_spending_b_remaining: newRemainingAmount,
          },
    });
  }

  async resetFreeSpending(coupleId: string): Promise<void> {
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
    });

    if (!couple) return;

    await this.prisma.couple.update({
      where: { id: coupleId },
      data: {
        free_spending_a_remaining: couple.free_spending_a_monthly,
        free_spending_b_remaining: couple.free_spending_b_monthly,
      },
    });
  }

  async updateFinancialModel(
    coupleId: string,
    data: {
      financial_model: FinancialModel;
      allow_personal_accounts: boolean;
      allow_private_transactions: boolean;
    },
  ): Promise<void> {
    await this.prisma.couple.update({
      where: { id: coupleId },
      data: {
        financial_model: data.financial_model,
        allow_personal_accounts: data.allow_personal_accounts,
        allow_private_transactions: data.allow_private_transactions,
      },
    });
  }
}
