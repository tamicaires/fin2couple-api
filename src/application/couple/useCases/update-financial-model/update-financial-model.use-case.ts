import { Injectable, Inject, ForbiddenException } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { CoupleNotFoundException } from '@core/exceptions/couple/couple-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';
import { FinancialModel } from '@prisma/client';

export interface UpdateFinancialModelInput {
  coupleId: string;
  userId: string;
  financial_model: FinancialModel;
  reason?: string;
}

export interface UpdateFinancialModelOutput {
  success: boolean;
  financial_model: FinancialModel;
  allow_personal_accounts: boolean;
  allow_private_transactions: boolean;
}

/**
 * Update Financial Model Use Case
 *
 * Allows couples to change their financial management model
 *
 * Business Rules:
 * - Updates financial model and sets appropriate feature flags
 * - TRANSPARENT: No personal accounts, no private transactions
 * - AUTONOMOUS: Allows personal accounts and private transactions
 * - CUSTOM: User configures individually
 * - Partner is notified of the change
 */
@Injectable()
export class UpdateFinancialModelUseCase
  implements IUseCase<UpdateFinancialModelInput, UpdateFinancialModelOutput>
{
  constructor(
    @Inject('ICoupleRepository')
    private readonly coupleRepository: ICoupleRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: UpdateFinancialModelInput): Promise<UpdateFinancialModelOutput> {
    this.logger.logUseCase('UpdateFinancialModelUseCase', {
      coupleId: input.coupleId,
      userId: input.userId,
      financial_model: input.financial_model,
      reason: input.reason,
    });

    // Get couple
    const couple = await this.coupleRepository.findById(input.coupleId);
    if (!couple) {
      throw new CoupleNotFoundException(input.coupleId);
    }

    // Verify user belongs to couple
    if (!couple.isUserA(input.userId) && !couple.isUserB(input.userId)) {
      throw new ForbiddenException('User does not belong to this couple');
    }

    // Determine feature flags based on financial model
    let allow_personal_accounts = false;
    let allow_private_transactions = false;

    switch (input.financial_model) {
      case 'TRANSPARENT':
        allow_personal_accounts = false;
        allow_private_transactions = false;
        break;
      case 'AUTONOMOUS':
        allow_personal_accounts = true;
        allow_private_transactions = true;
        break;
      case 'CUSTOM':
        // Keep current settings for CUSTOM
        allow_personal_accounts = couple.allow_personal_accounts;
        allow_private_transactions = couple.allow_private_transactions;
        break;
    }

    // Update in repository
    await this.coupleRepository.updateFinancialModel(input.coupleId, {
      financial_model: input.financial_model,
      allow_personal_accounts,
      allow_private_transactions,
    });

    this.logger.log('Financial model updated successfully', {
      coupleId: input.coupleId,
      userId: input.userId,
      oldModel: couple.financial_model,
      newModel: input.financial_model,
      allow_personal_accounts,
      allow_private_transactions,
    });

    // TODO: Emit event to notify partner
    // this.eventEmitter.emit('financial-model.changed', { coupleId, userId, model, reason });

    return {
      success: true,
      financial_model: input.financial_model,
      allow_personal_accounts,
      allow_private_transactions,
    };
  }
}
