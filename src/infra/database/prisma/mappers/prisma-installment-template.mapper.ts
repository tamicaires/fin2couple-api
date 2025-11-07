import {
  InstallmentTemplate as PrismaInstallmentTemplate,
  TransactionVisibility as PrismaTransactionVisibility,
  Prisma,
} from '@prisma/client';
import { InstallmentTemplate } from '@core/domain/entities/installment-template.entity';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';

/**
 * Prisma Installment Template Mapper
 *
 * Converts Prisma Decimal to number for amounts
 */
export class PrismaInstallmentTemplateMapper {
  static toDomain(prismaTemplate: PrismaInstallmentTemplate): InstallmentTemplate {
    return new InstallmentTemplate({
      id: prismaTemplate.id,
      couple_id: prismaTemplate.couple_id,
      description: prismaTemplate.description,
      total_amount: Number(prismaTemplate.total_amount),
      total_installments: prismaTemplate.total_installments,
      paid_by_id: prismaTemplate.paid_by_id,
      account_id: prismaTemplate.account_id,
      category_id: prismaTemplate.category_id,
      is_couple_expense: prismaTemplate.is_couple_expense,
      is_free_spending: prismaTemplate.is_free_spending,
      visibility: prismaTemplate.visibility as TransactionVisibility,
      first_due_date: prismaTemplate.first_due_date,
      is_active: prismaTemplate.is_active,
      created_at: prismaTemplate.created_at,
      updated_at: prismaTemplate.updated_at,
    });
  }

  static toPrisma(
    template: InstallmentTemplate,
  ): Omit<PrismaInstallmentTemplate, 'created_at' | 'updated_at'> {
    return {
      id: template.id,
      couple_id: template.couple_id,
      description: template.description,
      total_amount: new Prisma.Decimal(template.total_amount),
      total_installments: template.total_installments,
      paid_by_id: template.paid_by_id,
      account_id: template.account_id,
      category_id: template.category_id,
      is_couple_expense: template.is_couple_expense,
      is_free_spending: template.is_free_spending,
      visibility: template.visibility as PrismaTransactionVisibility,
      first_due_date: template.first_due_date,
      is_active: template.is_active,
    };
  }
}
