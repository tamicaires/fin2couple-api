import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ICategoryRepository } from '@core/domain/repositories/category.repository';
import { Category } from '@core/domain/entities/category.entity';

@Injectable()
export class PrismaCategoryRepository implements ICategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(category: Category): Promise<Category> {
    const data = await this.prisma.category.create({
      data: {
        id: category.id,
        couple_id: category.couple_id,
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
        is_default: category.is_default,
        created_at: category.created_at,
        updated_at: category.updated_at,
      },
    });

    return new Category(data);
  }

  async findById(id: string): Promise<Category | null> {
    const data = await this.prisma.category.findUnique({
      where: { id },
    });

    return data ? new Category(data) : null;
  }

  async findAll(coupleId: string): Promise<Category[]> {
    const data = await this.prisma.category.findMany({
      where: { couple_id: coupleId },
      orderBy: [
        { is_default: 'desc' },
        { name: 'asc' },
      ],
    });

    return data.map((item) => new Category(item));
  }

  async findByCoupleAndType(
    coupleId: string,
    type: 'INCOME' | 'EXPENSE' | null,
  ): Promise<Category[]> {
    const data = await this.prisma.category.findMany({
      where: {
        couple_id: coupleId,
        OR: [
          { type: type },
          { type: null }, // Categories applicable to both types
        ],
      },
      orderBy: [
        { is_default: 'desc' },
        { name: 'asc' },
      ],
    });

    return data.map((item) => new Category(item));
  }

  async update(category: Category): Promise<Category> {
    const data = await this.prisma.category.update({
      where: { id: category.id },
      data: {
        name: category.name,
        icon: category.icon,
        color: category.color,
        type: category.type,
        updated_at: new Date(),
      },
    });

    return new Category(data);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({
      where: { id },
    });
  }
}
