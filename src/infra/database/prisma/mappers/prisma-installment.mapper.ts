import {
  Installment as PrismaInstallment,
  OccurrenceStatus as PrismaOccurrenceStatus,
  Prisma,
} from '@prisma/client';
import { Installment } from '@core/domain/entities/installment.entity';
import { OccurrenceStatus } from '@core/enum/occurrence-status.enum';

/**
 * Prisma Installment Mapper
 *
 * Converts Prisma Decimal to number for amounts
 */
export class PrismaInstallmentMapper {
  static toDomain(prismaInstallment: PrismaInstallment): Installment {
    return new Installment({
      id: prismaInstallment.id,
      template_id: prismaInstallment.template_id,
      installment_number: prismaInstallment.installment_number,
      amount: Number(prismaInstallment.amount),
      due_date: prismaInstallment.due_date,
      status: prismaInstallment.status as OccurrenceStatus,
      transaction_id: prismaInstallment.transaction_id,
      created_at: prismaInstallment.created_at,
      updated_at: prismaInstallment.updated_at,
    });
  }

  static toPrisma(
    installment: Installment,
  ): Omit<PrismaInstallment, 'created_at' | 'updated_at'> {
    return {
      id: installment.id,
      template_id: installment.template_id,
      installment_number: installment.installment_number,
      amount: new Prisma.Decimal(installment.amount),
      due_date: installment.due_date,
      status: installment.status as PrismaOccurrenceStatus,
      transaction_id: installment.transaction_id,
    };
  }
}
