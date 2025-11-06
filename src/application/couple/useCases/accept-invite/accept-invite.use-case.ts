import { Injectable, Inject, BadRequestException, NotFoundException } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICoupleInviteRepository } from '@core/domain/repositories/couple-invite.repository';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { IUserRepository } from '@core/domain/repositories/user.repository';
import { IPlanRepository } from '@core/domain/repositories/plan.repository';
import { Couple } from '@core/domain/entities/couple.entity';
import { Subscription } from '@core/domain/entities/subscription.entity';
import { User, UserRole } from '@core/domain/entities/user.entity';
import { UnitOfWork } from '@infra/database/prisma/unit-of-work';
import { LoggerService } from '@infra/logging/logger.service';
import { SubscriptionStatus } from '@core/enum/subscription-status.enum';
import * as bcrypt from 'bcrypt';

export interface AcceptInviteInput {
  token: string;
  password: string;
}

export interface AcceptInviteOutput {
  user: {
    id: string;
    name: string;
    email: string;
  };
  couple: {
    id: string;
    partner_name: string;
  };
  message: string;
}

/**
 * Accept Invite Use Case
 *
 * Accepts a couple invite by creating the invitee user and couple
 *
 * Business Rules:
 * - Invite must exist and be valid
 * - Invite must not be expired
 * - Creates user with provided password
 * - Creates couple linking inviter and invitee
 * - Creates FREE plan subscription with 30-day trial
 * - Marks invite as accepted
 */
@Injectable()
export class AcceptInviteUseCase implements IUseCase<AcceptInviteInput, AcceptInviteOutput> {
  private readonly TRIAL_DAYS = 30;

  constructor(
    @Inject('ICoupleInviteRepository')
    private readonly inviteRepository: ICoupleInviteRepository,
    @Inject('ICoupleRepository')
    private readonly coupleRepository: ICoupleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('IPlanRepository')
    private readonly planRepository: IPlanRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: AcceptInviteInput): Promise<AcceptInviteOutput> {
    this.logger.logUseCase('AcceptInviteUseCase', {
      token: input.token.substring(0, 10) + '...',
    });

    // 1. Find and validate invite
    const invite = await this.inviteRepository.findByToken(input.token);
    if (!invite) {
      throw new NotFoundException('Invite not found');
    }

    if (!invite.canBeAccepted()) {
      throw new BadRequestException('Invite is no longer valid or has expired');
    }

    // 2. Check if inviter still exists and is not in a couple
    const inviter = await this.userRepository.findById(invite.inviter_id);
    if (!inviter) {
      throw new BadRequestException('Este convite não é mais válido. O usuário que enviou o convite não existe mais no sistema.');
    }

    const inviterInCouple = await this.coupleRepository.existsByUserId(invite.inviter_id);
    if (inviterInCouple) {
      throw new BadRequestException('Inviter is already in a couple');
    }

    // 3. Get FREE plan
    const freePlan = await this.planRepository.findFreePlan();
    if (!freePlan) {
      throw new Error('FREE plan not found in database. Run seed first.');
    }

    // 4. Create user, couple, subscription, and update invite in a transaction
    const result = await this.unitOfWork.execute(async (prisma) => {
      // Create the invitee user
      const passwordHash = await bcrypt.hash(input.password, 10);
      const newUser = new User({
        email: invite.invitee_email,
        name: invite.invitee_name,
        password_hash: passwordHash,
        role: UserRole.USER,
      });

      const createdUser = await prisma.user.create({
        data: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          password_hash: newUser.password_hash,
          role: newUser.role,
        },
      });

      // Create couple
      const couple = new Couple({
        user_id_a: invite.inviter_id,
        user_id_b: createdUser.id,
        free_spending_a_monthly: 0,
        free_spending_b_monthly: 0,
        free_spending_a_remaining: 0,
        free_spending_b_remaining: 0,
        reset_day: 1,
        financial_model: 'CUSTOM',
        allow_personal_accounts: true,
        allow_private_transactions: true,
      });

      const createdCouple = await prisma.couple.create({
        data: {
          id: couple.id,
          user_id_a: couple.user_id_a,
          user_id_b: couple.user_id_b,
          free_spending_a_monthly: couple.free_spending_a_monthly,
          free_spending_b_monthly: couple.free_spending_b_monthly,
          free_spending_a_remaining: couple.free_spending_a_remaining,
          free_spending_b_remaining: couple.free_spending_b_remaining,
          reset_day: couple.reset_day,
          financial_model: couple.financial_model,
          allow_personal_accounts: couple.allow_personal_accounts,
          allow_private_transactions: couple.allow_private_transactions,
        },
      });

      // Create subscription (30-day trial)
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + this.TRIAL_DAYS);

      const subscription = new Subscription({
        couple_id: createdCouple.id,
        plan_id: freePlan.id,
        status: SubscriptionStatus.TRIAL,
        end_date: endDate,
      });

      await prisma.subscription.create({
        data: {
          id: subscription.id,
          couple_id: subscription.couple_id,
          plan_id: subscription.plan_id,
          status: subscription.status,
          start_date: subscription.start_date,
          end_date: subscription.end_date,
        },
      });

      // Create game profiles for both users (only if they don't exist)
      const inviterProfile = await prisma.userGameProfile.findUnique({
        where: { user_id: invite.inviter_id },
      });

      if (!inviterProfile) {
        await prisma.userGameProfile.create({
          data: {
            id: require('crypto').randomUUID(),
            user_id: invite.inviter_id,
          },
        });
      }

      await prisma.userGameProfile.create({
        data: {
          id: require('crypto').randomUUID(),
          user_id: createdUser.id,
        },
      });

      // Update invite
      invite.accept(createdCouple.id);
      await prisma.coupleInvite.update({
        where: { id: invite.id },
        data: {
          status: invite.status,
          couple_id: invite.couple_id,
          accepted_at: invite.accepted_at,
        },
      });

      return { user: createdUser, couple: createdCouple, inviter };
    });

    this.logger.log('Invite accepted successfully', {
      userId: result.user.id,
      coupleId: result.couple.id,
    });

    return {
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
      },
      couple: {
        id: result.couple.id,
        partner_name: result.inviter.name,
      },
      message: 'Invite accepted successfully. You can now sign in with your credentials.',
    };
  }
}
