import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PrismaTenantService } from '../prisma-tenant.service';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { Account } from '@core/domain/entities/account.entity';
import { PrismaAccountMapper } from '../mappers/prisma-account.mapper';

/**
 * Prisma Account Repository
 *
 * IMPORTANT: Uses PrismaTenantService for automatic couple_id filtering
 */
@Injectable()
export class PrismaAccountRepository implements IAccountRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: PrismaTenantService,
  ) {}

  async findById(id: string): Promise<Account | null> {
    const coupleId = this.tenant.getCoupleId();

    const account = await this.prisma.account.findFirst({
      where: {
        id,
        couple_id: coupleId, // Tenant isolation
      },
    });

    return account ? PrismaAccountMapper.toDomain(account) : null;
  }

  async findByCoupleId(coupleId: string): Promise<Account[]> {
    const accounts = await this.prisma.account.findMany({
      where: { couple_id: coupleId },
      orderBy: { created_at: 'desc' },
    });

    return accounts.map(PrismaAccountMapper.toDomain);
  }

  async findByOwnerId(ownerId: string): Promise<Account[]> {
    const coupleId = this.tenant.getCoupleId();

    const accounts = await this.prisma.account.findMany({
      where: {
        couple_id: coupleId,
        owner_id: ownerId,
      },
      orderBy: { created_at: 'desc' },
    });

    return accounts.map(PrismaAccountMapper.toDomain);
  }

  async findJointAccounts(coupleId: string): Promise<Account[]> {
    const accounts = await this.prisma.account.findMany({
      where: {
        couple_id: coupleId,
        owner_id: null, // Joint accounts have no owner
      },
      orderBy: { created_at: 'desc' },
    });

    return accounts.map(PrismaAccountMapper.toDomain);
  }

  async findVisibleAccounts(coupleId: string, userId: string): Promise<Account[]> {
    const accounts = await this.prisma.account.findMany({
      where: {
        couple_id: coupleId,
        OR: [
          { owner_id: null }, // Joint accounts
          { owner_id: userId }, // User's personal accounts
        ],
      },
      orderBy: { created_at: 'desc' },
    });

    return accounts.map(PrismaAccountMapper.toDomain);
  }

  async create(account: Account): Promise<Account> {
    const created = await this.prisma.account.create({
      data: PrismaAccountMapper.toPrisma(account),
    });

    return PrismaAccountMapper.toDomain(created);
  }

  async update(id: string, data: Partial<Account>): Promise<Account> {
    const coupleId = this.tenant.getCoupleId();

    const updated = await this.prisma.account.update({
      where: {
        id,
        couple_id: coupleId, // Ensure user can only update their couple's accounts
      },
      data,
    });

    return PrismaAccountMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    const coupleId = this.tenant.getCoupleId();

    await this.prisma.account.delete({
      where: {
        id,
        couple_id: coupleId,
      },
    });
  }

  async countByCoupleId(coupleId: string): Promise<number> {
    return await this.prisma.account.count({
      where: { couple_id: coupleId },
    });
  }

  async getTotalBalance(coupleId: string): Promise<number> {
    const result = await this.prisma.account.aggregate({
      where: { couple_id: coupleId },
      _sum: {
        current_balance: true,
      },
    });

    return Number(result._sum.current_balance) || 0;
  }

  async updateBalance(id: string, newBalance: number): Promise<void> {
    const coupleId = this.tenant.getCoupleId();

    await this.prisma.account.update({
      where: {
        id,
        couple_id: coupleId,
      },
      data: {
        current_balance: newBalance,
      },
    });
  }
}
