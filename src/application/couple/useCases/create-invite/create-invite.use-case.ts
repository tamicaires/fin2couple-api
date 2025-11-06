import { Injectable, Inject, BadRequestException, ConflictException } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICoupleInviteRepository } from '@core/domain/repositories/couple-invite.repository';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { IUserRepository } from '@core/domain/repositories/user.repository';
import { CoupleInvite } from '@core/domain/entities/couple-invite.entity';
import { LoggerService } from '@infra/logging/logger.service';

export interface CreateInviteInput {
  inviter_id: string;
  invitee_name: string;
  invitee_email: string;
}

export interface CreateInviteOutput {
  invite: {
    id: string;
    invitee_name: string;
    invitee_email: string;
    token: string;
    invite_link: string;
    expires_at: Date;
    created_at: Date;
  };
}

/**
 * Create Invite Use Case
 *
 * Creates a couple invite that generates a unique link for the invitee
 *
 * Business Rules:
 * - Inviter must NOT already be in a couple
 * - Inviter must NOT have a pending invite
 * - Invitee email must NOT already be registered
 * - Invitee email must NOT have a pending invite
 */
@Injectable()
export class CreateInviteUseCase implements IUseCase<CreateInviteInput, CreateInviteOutput> {
  private readonly FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

  constructor(
    @Inject('ICoupleInviteRepository')
    private readonly inviteRepository: ICoupleInviteRepository,
    @Inject('ICoupleRepository')
    private readonly coupleRepository: ICoupleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: CreateInviteInput): Promise<CreateInviteOutput> {
    this.logger.logUseCase('CreateInviteUseCase', {
      inviter_id: input.inviter_id,
      invitee_email: input.invitee_email,
    });

    // 1. Check if inviter is already in a couple
    const inviterInCouple = await this.coupleRepository.existsByUserId(input.inviter_id);
    if (inviterInCouple) {
      throw new ConflictException('You are already in a couple');
    }

    // 2. Check if inviter already has a pending invite
    const hasPendingInvite = await this.inviteRepository.existsPendingInviteForInviter(input.inviter_id);
    if (hasPendingInvite) {
      throw new ConflictException('You already have a pending invite. Please cancel it first.');
    }

    // 3. Check if invitee email is already registered
    const inviteeExists = await this.userRepository.existsByEmail(input.invitee_email);
    if (inviteeExists) {
      throw new BadRequestException('This email is already registered. Ask them to create a couple with you directly.');
    }

    // 4. Check if invitee email already has a pending invite
    const inviteeHasPendingInvite = await this.inviteRepository.existsPendingInviteForEmail(input.invitee_email);
    if (inviteeHasPendingInvite) {
      throw new ConflictException('This email already has a pending invite');
    }

    // 5. Create the invite
    const invite = new CoupleInvite({
      inviter_id: input.inviter_id,
      invitee_name: input.invitee_name,
      invitee_email: input.invitee_email,
    });

    const createdInvite = await this.inviteRepository.create(invite);

    this.logger.log('Invite created successfully', {
      inviteId: createdInvite.id,
      inviteeEmail: createdInvite.invitee_email,
    });

    return {
      invite: {
        id: createdInvite.id,
        invitee_name: createdInvite.invitee_name,
        invitee_email: createdInvite.invitee_email,
        token: createdInvite.token,
        invite_link: createdInvite.getInviteLink(this.FRONTEND_URL),
        expires_at: createdInvite.expires_at,
        created_at: createdInvite.created_at,
      },
    };
  }
}
