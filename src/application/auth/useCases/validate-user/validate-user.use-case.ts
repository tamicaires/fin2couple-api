import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IUserRepository } from '@core/domain/repositories/user.repository';
import { User } from '@core/domain/entities/user.entity';
import { LoggerService } from '@infra/logging/logger.service';
import * as bcrypt from 'bcrypt';

export interface ValidateUserInput {
  email: string;
  password: string;
}

export type ValidateUserOutput = User | null;

/**
 * Validate User Use Case
 *
 * Used by LocalStrategy (Passport) to validate credentials
 *
 * Business Rules:
 * - Returns User if credentials are valid
 * - Returns null if credentials are invalid
 * - Does NOT throw exceptions (Passport handles that)
 */
@Injectable()
export class ValidateUserUseCase implements IUseCase<ValidateUserInput, ValidateUserOutput> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: ValidateUserInput): Promise<ValidateUserOutput> {
    this.logger.debug('ValidateUserUseCase', { email: input.email });

    // Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      return null;
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    if (!isPasswordValid) {
      this.logger.logSecurityEvent('Invalid password attempt', 'low', {
        userId: user.id,
        email: input.email,
      });
      return null;
    }

    return user;
  }
}
