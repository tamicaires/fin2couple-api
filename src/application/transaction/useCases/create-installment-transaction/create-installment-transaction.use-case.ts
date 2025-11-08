import { Injectable, Inject } from '@nestjs/common';
import { IInstallmentTemplateRepository } from '@core/domain/repositories/installment-template.repository';
import { IInstallmentRepository } from '@core/domain/repositories/installment.repository';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { InstallmentTemplate } from '@core/domain/entities/installment-template.entity';
import { Installment } from '@core/domain/entities/installment.entity';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { TransactionType } from '@core/enum/transaction-type.enum';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';
import { AccountNotFoundException } from '@core/exceptions/account/account-not-found.exception';

export interface CreateInstallmentTransactionInput {
  couple_id: string;
  total_amount: number;
  total_installments: number;
  description: string | null;
  paid_by_id: string;
  account_id: string;
  is_couple_expense: boolean;
  is_free_spending: boolean;
  visibility?: TransactionVisibility;
  category: string | null;
  first_installment_date: Date;
  pay_first_installment?: boolean;
}

export interface CreateInstallmentTransactionOutput {
  template: InstallmentTemplate;
  installments: Installment[];
  first_transaction: Transaction | null;
}

@Injectable()
export class CreateInstallmentTransactionUseCase {
  constructor(
    @Inject('IInstallmentTemplateRepository')
    private readonly templateRepository: IInstallmentTemplateRepository,
    @Inject('IInstallmentRepository')
    private readonly installmentRepository: IInstallmentRepository,
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
    @Inject('IAccountRepository')
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(input: CreateInstallmentTransactionInput): Promise<CreateInstallmentTransactionOutput> {
    this.validateInput(input);

    const account = await this.accountRepository.findById(input.account_id);
    if (!account) {
      throw new AccountNotFoundException(input.account_id);
    }

    const visibility = input.visibility ?? (account.owner_id ? 'PRIVATE' : 'SHARED');
    const template = this.createTemplate(input, visibility);
    const createdTemplate = await this.templateRepository.create(template);

    const installments = this.generateInstallments(createdTemplate);
    const createdInstallments = await this.installmentRepository.createMany(installments);

    let firstTransaction: Transaction | null = null;
    if (input.pay_first_installment && createdInstallments.length > 0) {
      const firstInstallment = createdInstallments[0];
      firstTransaction = await this.createFirstTransaction(createdTemplate, firstInstallment);
      firstInstallment.markAsPaid(firstTransaction.id);
      await this.installmentRepository.markAsPaid(firstInstallment.id, firstTransaction.id);
    }

    return {
      template: createdTemplate,
      installments: createdInstallments,
      first_transaction: firstTransaction,
    };
  }

  private validateInput(input: CreateInstallmentTransactionInput): void {
    if (input.total_installments < 2) {
      throw new Error('Total installments must be at least 2');
    }
    if (input.total_installments > 120) {
      throw new Error('Maximum 120 installments allowed');
    }
    if (input.total_amount <= 0) {
      throw new Error('Total amount must be positive');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const firstDate = new Date(input.first_installment_date);
    firstDate.setHours(0, 0, 0, 0);
    if (firstDate < today) {
      throw new Error('First installment date cannot be in the past');
    }
  }

  private createTemplate(
    input: CreateInstallmentTransactionInput,
    visibility: TransactionVisibility,
  ): InstallmentTemplate {
    return InstallmentTemplate.create({
      couple_id: input.couple_id,
      description: input.description ?? undefined,
      total_amount: input.total_amount,
      total_installments: input.total_installments,
      paid_by_id: input.paid_by_id,
      account_id: input.account_id,
      category_id: input.category ?? undefined,
      is_couple_expense: input.is_couple_expense,
      is_free_spending: input.is_free_spending,
      visibility,
      first_due_date: input.first_installment_date,
    });
  }

  private generateInstallments(template: InstallmentTemplate): Installment[] {
    const installmentAmount = template.getInstallmentAmount();
    const installments: Installment[] = [];

    for (let i = 1; i <= template.total_installments; i++) {
      const dueDate = template.calculateDueDate(i);
      const amount =
        i === template.total_installments
          ? template.total_amount - installmentAmount * (template.total_installments - 1)
          : installmentAmount;

      const installment = Installment.create({
        template_id: template.id,
        installment_number: i,
        amount: Math.round(amount * 100) / 100,
        due_date: dueDate,
      });

      installments.push(installment);
    }

    return installments;
  }

  private async createFirstTransaction(
    template: InstallmentTemplate,
    installment: Installment,
  ): Promise<Transaction> {
    const transaction = new Transaction({
      couple_id: template.couple_id,
      type: 'EXPENSE' as TransactionType,
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
      transaction_date: installment.due_date,
      installment_group_id: template.id,
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
