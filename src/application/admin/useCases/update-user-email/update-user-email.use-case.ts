import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IUserRepository } from '@core/domain/repositories/user.repository';
import { UserNotFoundException } from '@core/exceptions/user/user-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';

export interface UpdateUserEmailInput {
  userId: string;
  newEmail: string;
  reason?: string;
}

export interface UpdateUserEmailOutput {
  success: boolean;
  message: string;
  oldEmail: string;
  newEmail: string;
}

/**
 * Update User Email Use Case
 *
 * Admin only: Change user email (for support purposes)
 */
@Injectable()
export class UpdateUserEmailUseCase
  implements IUseCase<UpdateUserEmailInput, UpdateUserEmailOutput>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: UpdateUserEmailInput): Promise<UpdateUserEmailOutput> {
    this.logger.logUseCase('UpdateUserEmailUseCase', {
      userId: input.userId,
      newEmail: input.newEmail,
      reason: input.reason,
    });

    // Find user
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException(input.userId);
    }

    const oldEmail = user.email;

    // Check if new email is already taken
    const existingUser = await this.userRepository.findByEmail(input.newEmail);
    if (existingUser && existingUser.id !== user.id) {
      throw new ConflictException('Email already in use');
    }

    // Update email
    user.email = input.newEmail;
    user.updated_at = new Date();

    await this.userRepository.save(user);

    this.logger.log(
      `Admin changed user email: ${oldEmail} -> ${input.newEmail} (Reason: ${input.reason || 'Not specified'})`,
    );

    return {
      success: true,
      message: 'Email updated successfully',
      oldEmail,
      newEmail: input.newEmail,
    };
  }
}
