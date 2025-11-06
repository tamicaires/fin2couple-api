import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { CoupleNotFoundException } from '@core/exceptions/couple/couple-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';

export interface UpdateFreeSpendingInput {
  coupleId: string;
  userId: string;
  newMonthlyAmount: number;
}

export interface UpdateFreeSpendingOutput {
  success: boolean;
  user_id: string;
  new_monthly_amount: number;
  new_remaining_amount: number;
}

/**
 * Update Free Spending Use Case
 *
 * Allows manual adjustment of monthly free spending allowance
 *
 * Business Rules:
 * - Only updates the monthly amount for the specified user
 * - Remaining amount is adjusted proportionally
 * - If increasing: adds the difference to remaining
 * - If decreasing: subtracts proportionally from remaining (keeping usage)
 */
@Injectable()
export class UpdateFreeSpendingUseCase
  implements IUseCase<UpdateFreeSpendingInput, UpdateFreeSpendingOutput>
{
  constructor(
    @Inject('ICoupleRepository')

    private readonly coupleRepository: ICoupleRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: UpdateFreeSpendingInput): Promise<UpdateFreeSpendingOutput> {
    this.logger.logUseCase('UpdateFreeSpendingUseCase', {
      coupleId: input.coupleId,
      userId: input.userId,
      newMonthlyAmount: input.newMonthlyAmount,
    });

    // Get couple
    const couple = await this.coupleRepository.findById(input.coupleId);
    if (!couple) {
      throw new CoupleNotFoundException(input.coupleId);
    }

    // Determine which user (A or B)
    const isUserA = couple.isUserA(input.userId);
    const currentMonthly = isUserA
      ? couple.free_spending_a_monthly
      : couple.free_spending_b_monthly;
    const currentRemaining = isUserA
      ? couple.free_spending_a_remaining
      : couple.free_spending_b_remaining;

    // Calculate new remaining amount
    // If increasing monthly: add the difference to remaining
    // If decreasing monthly: subtract proportionally
    const difference = input.newMonthlyAmount - currentMonthly;
    const newRemaining = currentRemaining + difference;

    // Ensure remaining doesn't go negative
    const finalRemaining = Math.max(0, newRemaining);

    // Update in repository
    await this.coupleRepository.updateFreeSpending(
      input.coupleId,
      input.userId,
      input.newMonthlyAmount,
      finalRemaining,
    );

    this.logger.log('Free spending updated successfully', {
      coupleId: input.coupleId,
      userId: input.userId,
      oldMonthly: currentMonthly,
      newMonthly: input.newMonthlyAmount,
      oldRemaining: currentRemaining,
      newRemaining: finalRemaining,
    });

    return {
      success: true,
      user_id: input.userId,
      new_monthly_amount: input.newMonthlyAmount,
      new_remaining_amount: finalRemaining,
    };
  }
}
