import { Injectable, Inject } from '@nestjs/common';
import { IInstallmentRepository } from '@core/domain/repositories/installment.repository';
import { IInstallmentTemplateRepository } from '@core/domain/repositories/installment-template.repository';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { Installment } from '@core/domain/entities/installment.entity';
import { Transaction } from '@core/domain/entities/transaction.entity';

export interface PayInstallmentInput {
  installment_id: string;
  transaction_date?: Date; // Optional custom transaction date (defaults to installment due_date)
}

export interface PayInstallmentOutput {
  installment: Installment;
  transaction: Transaction;
}

/**
 * Use Case: Pay Installment
 *
 * Marks an installment as paid by creating the actual transaction.
 * This is the bridge between scheduled installments and actual transactions.
 *
 * Business Rules:
 * - Only pending installments can be paid
 * - Cannot pay overdue installments (>30 days past due)
 * - Creates transaction with template's configuration
 * - Links transaction to installment
 * - Marks installment as PAID
 * - Transaction description includes installment number (e.g., "2/12")
 *
 * Design Pattern: Factory Method + Command
 * - Factory: Creates transaction from template and installment
 * - Command: Executes the payment action
 */
@Injectable()
export class PayInstallmentUseCase {
  constructor(
    @Inject('IInstallmentRepository')
    private readonly installmentRepository: IInstallmentRepository,
    @Inject('IInstallmentTemplateRepository')
    private readonly templateRepository: IInstallmentTemplateRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(input: PayInstallmentInput): Promise<PayInstallmentOutput> {
    // Get installment
    const installment = await this.installmentRepository.findById(input.installment_id);
    if (!installment) {
      throw new Error('Installment not found');
    }

    // Validate can be paid
    if (!installment.canBePaid()) {
      if (installment.isPaid()) {
        throw new Error('Installment is already paid');
      }
      if (installment.isSkipped()) {
        throw new Error('Cannot pay skipped installment');
      }
      if (installment.isOverdue()) {
        throw new Error('Cannot pay overdue installment (>30 days past due)');
      }
      throw new Error('Installment cannot be paid');
    }

    // Get template to create transaction
    const template = await this.templateRepository.findById(installment.template_id);
    if (!template) {
      throw new Error('Template not found');
    }

    // Create transaction from template and installment
    const transactionDate = input.transaction_date || installment.due_date;
    const transaction = await this.createTransactionFromInstallment(
      template,
      installment,
      transactionDate,
    );

    // Mark installment as paid
    installment.markAsPaid(transaction.id);
    await this.installmentRepository.markAsPaid(installment.id, transaction.id);

    return {
      installment,
      transaction,
    };
  }

  /**
   * Factory Method: Creates a transaction from template and installment
   */
  private async createTransactionFromInstallment(
    template: any,
    installment: Installment,
    transactionDate: Date,
  ): Promise<Transaction> {
    const transaction = new Transaction({
      couple_id: template.couple_id,
      type: 'EXPENSE', // Installments are always expenses
      amount: installment.amount,
      description: this.buildDescription(
        template.description,
        installment.installment_number,
        template.total_installments,
      ),
      paid_by_id: template.paid_by_id,
      account_id: template.account_id,
      is_couple_expense: template.is_couple_expense,
      is_free_spending: template.is_free_spending,
      visibility: template.visibility,
      category: template.category_id,
      transaction_date: transactionDate,
      installment_group_id: template.id, // Use template_id as group_id
      installment_number: installment.installment_number,
      total_installments: template.total_installments,
      recurring_template_id: null,
    });

    return await this.transactionRepository.create(transaction);
  }

  private buildDescription(
    baseDescription: string | null,
    installmentNumber: number,
    totalInstallments: number,
  ): string {
    const installmentInfo = `${installmentNumber}/${totalInstallments}`;

    if (!baseDescription) {
      return `Parcela ${installmentInfo}`;
    }

    return `${baseDescription} - Parcela ${installmentInfo}`;
  }
}
