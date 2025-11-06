import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IPlanRepository } from '@core/domain/repositories/plan.repository';
import { Plan } from '@core/domain/entities/plan.entity';
import { PrismaPlanMapper } from '../mappers/prisma-plan.mapper';

@Injectable()
export class PrismaPlanRepository implements IPlanRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Plan | null> {
    const plan = await this.prisma.plan.findUnique({
      where: { id },
    });

    return plan ? PrismaPlanMapper.toDomain(plan) : null;
  }

  async findByName(name: string): Promise<Plan | null> {
    const plan = await this.prisma.plan.findUnique({
      where: { name },
    });

    return plan ? PrismaPlanMapper.toDomain(plan) : null;
  }

  async findAll(): Promise<Plan[]> {
    const plans = await this.prisma.plan.findMany({
      orderBy: { price_monthly: 'asc' },
    });

    return plans.map(PrismaPlanMapper.toDomain);
  }

  async findActive(): Promise<Plan[]> {
    // For now, all plans are active. In the future, add an "active" field
    return this.findAll();
  }

  async create(plan: Plan): Promise<Plan> {
    const created = await this.prisma.plan.create({
      data: PrismaPlanMapper.toPrisma(plan),
    });

    return PrismaPlanMapper.toDomain(created);
  }

  async update(id: string, data: Partial<Plan>): Promise<Plan> {
    const updated = await this.prisma.plan.update({
      where: { id },
      data,
    });

    return PrismaPlanMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.plan.delete({
      where: { id },
    });
  }

  async findFreePlan(): Promise<Plan | null> {
    const plan = await this.prisma.plan.findFirst({
      where: { price_monthly: 0 },
    });

    return plan ? PrismaPlanMapper.toDomain(plan) : null;
  }

  async findByPriceRange(minPrice: number, maxPrice: number): Promise<Plan[]> {
    const plans = await this.prisma.plan.findMany({
      where: {
        price_monthly: {
          gte: minPrice,
          lte: maxPrice,
        },
      },
      orderBy: { price_monthly: 'asc' },
    });

    return plans.map(PrismaPlanMapper.toDomain);
  }
}
