import { Account as PrismaAccount, AccountType as PrismaAccountType, Prisma } from '@prisma/client';
import { Account } from '@core/domain/entities/account.entity';
import { AccountType as DomainAccountType } from '@core/enum/account-type.enum';

/**
 * Prisma Account Mapper
 *
 * Converts Prisma Decimal to number for balance
 * Maps between Prisma and Domain AccountType enums
 */
export class PrismaAccountMapper {
  static toDomain(prismaAccount: PrismaAccount): Account {
    return new Account({
      id: prismaAccount.id,
      couple_id: prismaAccount.couple_id,
      owner_id: prismaAccount.owner_id,
      name: prismaAccount.name,
      type: prismaAccount.type as DomainAccountType,
      current_balance: Number(prismaAccount.current_balance),
      created_at: prismaAccount.created_at,
      updated_at: prismaAccount.updated_at,
    });
  }

  static toPrisma(account: Account): Omit<PrismaAccount, 'created_at' | 'updated_at'> {
    return {
      id: account.id,
      couple_id: account.couple_id,
      owner_id: account.owner_id,
      name: account.name,
      type: account.type as PrismaAccountType,
      current_balance: new Prisma.Decimal(account.current_balance),
      archived_at: null,
    };
  }
}
