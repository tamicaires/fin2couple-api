import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IUserRepository } from '@core/domain/repositories/user.repository';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { Couple } from '@core/domain/entities/couple.entity';
import { UserNotFoundException } from '@core/exceptions/user/user-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';

export interface LinkCoupleInput {
  user_id_a: string;
  user_id_b: string;
  reason?: string;
}

export interface LinkCoupleOutput {
  success: boolean;
  message: string;
  couple_id: string;
  user_a_name: string;
  user_b_name: string;
}

/**
 * Link Couple Use Case
 *
 * Admin only: Manually create a couple link between two users
 */
@Injectable()
export class LinkCoupleUseCase
  implements IUseCase<LinkCoupleInput, LinkCoupleOutput>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ICoupleRepository')
    private readonly coupleRepository: ICoupleRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: LinkCoupleInput): Promise<LinkCoupleOutput> {
    this.logger.logUseCase('LinkCoupleUseCase', {
      user_id_a: input.user_id_a,
      user_id_b: input.user_id_b,
      reason: input.reason,
    });

    // Validate users are different
    if (input.user_id_a === input.user_id_b) {
      throw new BadRequestException('Cannot link user to themselves');
    }

    // Find both users
    const [userA, userB] = await Promise.all([
      this.userRepository.findById(input.user_id_a),
      this.userRepository.findById(input.user_id_b),
    ]);

    if (!userA) {
      throw new UserNotFoundException(input.user_id_a);
    }
    if (!userB) {
      throw new UserNotFoundException(input.user_id_b);
    }

    // Check if either user is already in a couple
    const existingCoupleA = await this.coupleRepository.findByUserId(userA.id);
    const existingCoupleB = await this.coupleRepository.findByUserId(userB.id);

    if (existingCoupleA) {
      throw new ConflictException(
        `User ${userA.name} is already in a couple`,
      );
    }
    if (existingCoupleB) {
      throw new ConflictException(
        `User ${userB.name} is already in a couple`,
      );
    }

    // Create couple with default values
    const couple = new Couple({
      user_id_a: userA.id,
      user_id_b: userB.id,
      free_spending_a_monthly: 0,
      free_spending_b_monthly: 0,
      free_spending_a_remaining: 0,
      free_spending_b_remaining: 0,
      reset_day: 1,
      financial_model: 'CUSTOM',
      allow_personal_accounts: true,
      allow_private_transactions: true,
    });

    await this.coupleRepository.create(couple);

    this.logger.log(
      `Admin linked couple: ${userA.name} & ${userB.name} (Reason: ${input.reason || 'Not specified'})`,
    );

    return {
      success: true,
      message: 'Couple linked successfully',
      couple_id: couple.id,
      user_a_name: userA.name,
      user_b_name: userB.name,
    };
  }
}
