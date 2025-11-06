import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IUserRepository } from '@core/domain/repositories/user.repository';
import { User } from '@core/domain/entities/user.entity';
import { PrismaUserMapper } from '../mappers/prisma-user.mapper';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    return user ? PrismaUserMapper.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    return user ? PrismaUserMapper.toDomain(user) : null;
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany();
    return users.map(PrismaUserMapper.toDomain);
  }

  async create(user: User): Promise<User> {
    const created = await this.prisma.user.create({
      data: PrismaUserMapper.toPrisma(user),
    });

    return PrismaUserMapper.toDomain(created);
  }

  async save(user: User): Promise<User> {
    const saved = await this.prisma.user.update({
      where: { id: user.id },
      data: PrismaUserMapper.toPrisma(user),
    });

    return PrismaUserMapper.toDomain(saved);
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const updated = await this.prisma.user.update({
      where: { id },
      data,
    });

    return PrismaUserMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email },
    });

    return count > 0;
  }
}
