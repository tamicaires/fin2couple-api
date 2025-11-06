import { Injectable, Inject } from '@nestjs/common';
import { ITransactionRepository } from '@core/domain/repositories/transaction.repository';
import { Transaction } from '@core/domain/entities/transaction.entity';
import { InstallmentInfo } from '@core/domain/value-objects/installment-info.vo';
import { TransactionType } from '@core/enum/transaction-type.enum';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';
import { addMonths } from 'date-fns';

export interface CreateInstallmentTransactionInput {
  couple_id: string;
  type: TransactionType;
  total_amount: number;
  total_installments: number;
  description: string | null;
  paid_by_id: string;
  account_id: string;
  is_couple_expense: boolean;
  is_free_spending: boolean;
  visibility: TransactionVisibility;
  category: string | null;
  first_installment_date: Date;
}

export interface CreateInstallmentTransactionOutput {
  installments: Transaction[];
  installment_group_id: string;
}

/**
 * Use Case: Create Installment Transaction
 *
 * Creates multiple transactions representing installments of a purchase.
 * Each installment is a separate transaction linked by a group ID.
 *
 * Business Rules:
 * - Total installments must be at least 2
 * - Amount is divided equally among installments
 * - Installments are created monthly starting from first_installment_date
 * - All installments share the same group_id
 */
@Injectable()
export class CreateInstallmentTransactionUseCase {
  constructor(
    @Inject('ITransactionRepository')
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(input: CreateInstallmentTransactionInput): Promise<CreateInstallmentTransactionOutput> {
    this.validateInput(input);

    // Calculate amount per installment
    const amountPerInstallment = this.calculateAmountPerInstallment(
      input.total_amount,
      input.total_installments,
    );

    // Create installment info for the first installment
    const installmentInfo = InstallmentInfo.createNew(input.total_installments);

    // Generate all installments
    const installments = this.generateInstallments(input, installmentInfo, amountPerInstallment);

    // Save all installments in batch
    const createdInstallments = await this.transactionRepository.createBatch(installments);

    return {
      installments: createdInstallments,
      installment_group_id: installmentInfo.groupId,
    };
  }

  private validateInput(input: CreateInstallmentTransactionInput): void {
    if (input.total_installments < 2) {
      throw new Error('Total installments must be at least 2');
    }

    if (input.total_amount <= 0) {
      throw new Error('Total amount must be positive');
    }
  }

  private calculateAmountPerInstallment(totalAmount: number, totalInstallments: number): number {
    // Divide equally and round to 2 decimal places
    return Math.round((totalAmount / totalInstallments) * 100) / 100;
  }

  private generateInstallments(
    input: CreateInstallmentTransactionInput,
    firstInstallmentInfo: InstallmentInfo,
    amountPerInstallment: number,
  ): Transaction[] {
    const installments: Transaction[] = [];
    let currentInstallmentInfo: InstallmentInfo | null = firstInstallmentInfo;
    let currentDate = input.first_installment_date;

    while (currentInstallmentInfo !== null) {
      const isLastInstallment = currentInstallmentInfo.isLast();

      // For the last installment, adjust amount to account for rounding differences
      const amount = isLastInstallment
        ? this.calculateLastInstallmentAmount(input.total_amount, amountPerInstallment, input.total_installments)
        : amountPerInstallment;

      const transaction = new Transaction({
        couple_id: input.couple_id,
        type: input.type,
        amount,
        description: this.buildInstallmentDescription(input.description, currentInstallmentInfo),
        paid_by_id: input.paid_by_id,
        account_id: input.account_id,
        is_couple_expense: input.is_couple_expense,
        is_free_spending: input.is_free_spending,
        visibility: input.visibility,
        category: input.category,
        transaction_date: currentDate,
        installment_group_id: currentInstallmentInfo.groupId,
        installment_number: currentInstallmentInfo.currentNumber,
        total_installments: currentInstallmentInfo.totalInstallments,
        recurring_template_id: null,
      });

      installments.push(transaction);

      // Move to next installment
      currentInstallmentInfo = currentInstallmentInfo.next();
      currentDate = addMonths(currentDate, 1);
    }

    return installments;
  }

  private calculateLastInstallmentAmount(
    totalAmount: number,
    amountPerInstallment: number,
    totalInstallments: number,
  ): number {
    // Calculate what was already allocated
    const allocatedAmount = amountPerInstallment * (totalInstallments - 1);
    // Last installment gets the remainder to ensure total is exact
    return totalAmount - allocatedAmount;
  }

  private buildInstallmentDescription(
    baseDescription: string | null,
    installmentInfo: InstallmentInfo,
  ): string {
    const installmentLabel = installmentInfo.getLabel();

    if (!baseDescription) {
      return `Parcela ${installmentLabel}`;
    }

    return `${baseDescription} - Parcela ${installmentLabel}`;
  }
}
