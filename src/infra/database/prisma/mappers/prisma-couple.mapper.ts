import { Couple as PrismaCouple, Prisma } from '@prisma/client';
import { Couple } from '@core/domain/entities/couple.entity';

/**
 * Prisma Couple Mapper
 *
 * CRITICAL: Converts Prisma Decimal to number for domain entity
 */
export class PrismaCoupleMapper {
  static toDomain(prismaCouple: PrismaCouple): Couple {
    return new Couple({
      id: prismaCouple.id,
      user_id_a: prismaCouple.user_id_a,
      user_id_b: prismaCouple.user_id_b,
      free_spending_a_monthly: Number(prismaCouple.free_spending_a_monthly),
      free_spending_b_monthly: Number(prismaCouple.free_spending_b_monthly),
      free_spending_a_remaining: Number(prismaCouple.free_spending_a_remaining),
      free_spending_b_remaining: Number(prismaCouple.free_spending_b_remaining),
      reset_day: prismaCouple.reset_day,
      financial_model: prismaCouple.financial_model,
      allow_personal_accounts: prismaCouple.allow_personal_accounts,
      allow_private_transactions: prismaCouple.allow_private_transactions,
      created_at: prismaCouple.created_at,
      updated_at: prismaCouple.updated_at,
    });
  }

  static toPrisma(couple: Couple): Omit<PrismaCouple, 'created_at' | 'updated_at'> {
    return {
      id: couple.id,
      user_id_a: couple.user_id_a,
      user_id_b: couple.user_id_b,
      free_spending_a_monthly: new Prisma.Decimal(couple.free_spending_a_monthly),
      free_spending_b_monthly: new Prisma.Decimal(couple.free_spending_b_monthly),
      free_spending_a_remaining: new Prisma.Decimal(couple.free_spending_a_remaining),
      free_spending_b_remaining: new Prisma.Decimal(couple.free_spending_b_remaining),
      reset_day: couple.reset_day,
      financial_model: couple.financial_model,
      allow_personal_accounts: couple.allow_personal_accounts,
      allow_private_transactions: couple.allow_private_transactions,
    };
  }
}
