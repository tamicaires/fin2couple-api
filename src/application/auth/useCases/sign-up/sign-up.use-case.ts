import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IUserRepository } from '@core/domain/repositories/user.repository';
import { User } from '@core/domain/entities/user.entity';
import { UserAlreadyExistsException } from '@core/exceptions/auth/user-already-exists.exception';
import { LoggerService } from '@infra/logging/logger.service';
import * as bcrypt from 'bcrypt';

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

export interface SignUpOutput {
  id: string;
  email: string;
  name: string;
  created_at: Date;
}

/**
 * Sign Up Use Case
 *
 * Creates a new user account with hashed password
 *
 * Business Rules:
 * - Email must be unique
 * - Password must be hashed with bcrypt (10 rounds)
 * - User data is validated by User entity (Zod)
 */
@Injectable()
export class SignUpUseCase implements IUseCase<SignUpInput, SignUpOutput> {
  private readonly SALT_ROUNDS = 10;

  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: SignUpInput): Promise<SignUpOutput> {
    this.logger.logUseCase('SignUpUseCase', { email: input.email });

    // Check if email already exists
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new UserAlreadyExistsException(input.email);
    }

    // Hash password
    const password_hash = await bcrypt.hash(input.password, this.SALT_ROUNDS);

    // Create user entity (Zod validation happens here)
    const user = new User({
      email: input.email,
      password_hash,
      name: input.name,
    });

    // Persist
    const created = await this.userRepository.create(user);

    this.logger.log('User created successfully', { userId: created.id, email: created.email });

    return {
      id: created.id,
      email: created.email,
      name: created.name,
      created_at: created.created_at,
    };
  }
}
