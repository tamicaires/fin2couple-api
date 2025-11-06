import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { IUserRepository } from '@core/domain/repositories/user.repository';
import { CoupleNotFoundException } from '@core/exceptions/couple/couple-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';

export interface GetCoupleInfoInput {
  coupleId: string;
  userId: string;
}

export interface UserInfo {
  id: string;
  name: string;
  email: string;
}

export interface GetCoupleInfoOutput {
  couple: {
    id: string;
    created_at: Date;
    reset_day: number;
    financial_model: string;
    allow_personal_accounts: boolean;
    allow_private_transactions: boolean;
  };
  currentUser: UserInfo & {
    free_spending_monthly: number;
    free_spending_remaining: number;
  };
  partner: UserInfo & {
    free_spending_monthly: number;
    free_spending_remaining: number;
  };
}

/**
 * Get Couple Info Use Case
 *
 * Retrieves detailed information about the couple and both partners
 */
@Injectable()
export class GetCoupleInfoUseCase
  implements IUseCase<GetCoupleInfoInput, GetCoupleInfoOutput>
{
  constructor(
    @Inject('ICoupleRepository')
    private readonly coupleRepository: ICoupleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: GetCoupleInfoInput): Promise<GetCoupleInfoOutput> {
    this.logger.logUseCase('GetCoupleInfoUseCase', {
      coupleId: input.coupleId,
      userId: input.userId,
    });

    // Find couple
    const couple = await this.coupleRepository.findById(input.coupleId);
    if (!couple) {
      throw new CoupleNotFoundException(input.coupleId);
    }

    // Get partner ID
    const partnerId = couple.getPartnerId(input.userId);
    if (!partnerId) {
      throw new Error('User is not part of this couple');
    }

    // Get both users' information
    const [currentUser, partner] = await Promise.all([
      this.userRepository.findById(input.userId),
      this.userRepository.findById(partnerId),
    ]);

    if (!currentUser || !partner) {
      throw new Error('User information not found');
    }

    return {
      couple: {
        id: couple.id,
        created_at: couple.created_at,
        reset_day: couple.reset_day,
        financial_model: couple.financial_model,
        allow_personal_accounts: couple.allow_personal_accounts,
        allow_private_transactions: couple.allow_private_transactions,
      },
      currentUser: {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        free_spending_monthly: couple.getFreeSpendingMonthly(currentUser.id),
        free_spending_remaining: couple.getFreeSpendingRemaining(
          currentUser.id,
        ),
      },
      partner: {
        id: partner.id,
        name: partner.name,
        email: partner.email,
        free_spending_monthly: couple.getFreeSpendingMonthly(partner.id),
        free_spending_remaining: couple.getFreeSpendingRemaining(partner.id),
      },
    };
  }
}
