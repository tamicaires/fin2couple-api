import { Injectable, Inject } from '@nestjs/common';
import { IInstallmentTemplateRepository } from '@core/domain/repositories/installment-template.repository';
import { IInstallmentRepository } from '@core/domain/repositories/installment.repository';
import { InstallmentTemplate } from '@core/domain/entities/installment-template.entity';
import { Installment } from '@core/domain/entities/installment.entity';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';

export interface CreateInstallmentTemplateInput {
  couple_id: string;
  description: string | null;
  total_amount: number;
  total_installments: number;
  paid_by_id: string;
  account_id: string;
  category_id: string | null;
  is_couple_expense: boolean;
  is_free_spending: boolean;
  visibility: TransactionVisibility;
  first_due_date: Date;
}

export interface CreateInstallmentTemplateOutput {
  template: InstallmentTemplate;
  installments: Installment[];
}

/**
 * Use Case: Create Installment Template
 *
 * Creates a template for installment purchases and generates all
 * individual installments with PENDING status.
 *
 * Business Rules:
 * - Template stores purchase configuration
 * - Generates N installments based on total_installments
 * - Each installment has equal amount (total / N)
 * - Installments are due monthly starting from first_due_date
 * - All installments start as PENDING
 * - No transactions created until installments are paid
 *
 * Design Pattern: Factory Method + Builder
 * - Factory: Creates installments from template
 * - Builder: Builds template and installments together
 */
@Injectable()
export class CreateInstallmentTemplateUseCase {
  constructor(
    @Inject('IInstallmentTemplateRepository')
    private readonly templateRepository: IInstallmentTemplateRepository,
    @Inject('IInstallmentRepository')
    private readonly installmentRepository: IInstallmentRepository,
  ) {}

  async execute(input: CreateInstallmentTemplateInput): Promise<CreateInstallmentTemplateOutput> {
    this.validateInput(input);

    // Create template
    const template = this.createTemplate(input);
    const createdTemplate = await this.templateRepository.create(template);

    // Generate installments
    const installments = this.generateInstallments(createdTemplate);
    const createdInstallments = await this.installmentRepository.createMany(installments);

    return {
      template: createdTemplate,
      installments: createdInstallments,
    };
  }

  private validateInput(input: CreateInstallmentTemplateInput): void {
    if (input.total_amount <= 0) {
      throw new Error('Total amount must be positive');
    }

    if (input.total_installments < 2) {
      throw new Error('Minimum 2 installments required');
    }

    if (input.total_installments > 120) {
      throw new Error('Maximum 120 installments allowed');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const firstDueDate = new Date(input.first_due_date);
    firstDueDate.setHours(0, 0, 0, 0);

    if (firstDueDate < today) {
      throw new Error('First due date cannot be in the past');
    }
  }

  private createTemplate(input: CreateInstallmentTemplateInput): InstallmentTemplate {
    return InstallmentTemplate.create({
      couple_id: input.couple_id,
      description: input.description ?? undefined,
      total_amount: input.total_amount,
      total_installments: input.total_installments,
      paid_by_id: input.paid_by_id,
      account_id: input.account_id,
      category_id: input.category_id ?? undefined,
      is_couple_expense: input.is_couple_expense,
      is_free_spending: input.is_free_spending,
      visibility: input.visibility,
      first_due_date: input.first_due_date,
    });
  }

  /**
   * Factory Method: Generates all installments from template
   */
  private generateInstallments(template: InstallmentTemplate): Installment[] {
    const installmentAmount = template.getInstallmentAmount();
    const installments: Installment[] = [];

    for (let i = 1; i <= template.total_installments; i++) {
      const dueDate = template.calculateDueDate(i);

      // Handle rounding: last installment gets any remainder
      const amount =
        i === template.total_installments
          ? template.total_amount - installmentAmount * (template.total_installments - 1)
          : installmentAmount;

      const installment = Installment.create({
        template_id: template.id,
        installment_number: i,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimals
        due_date: dueDate,
      });

      installments.push(installment);
    }

    return installments;
  }
}
