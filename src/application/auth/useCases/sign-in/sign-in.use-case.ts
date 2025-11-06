import { Injectable, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IUserRepository } from '@core/domain/repositories/user.repository';
import { InvalidCredentialsException } from '@core/exceptions/auth/invalid-credentials.exception';
import { LoggerService } from '@infra/logging/logger.service';
import { JwtPayload } from '@shared/types/authenticated-user.type';
import * as bcrypt from 'bcrypt';

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignInOutput {
  access_token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

/**
 * Sign In Use Case
 *
 * Authenticates user and generates JWT token
 *
 * Business Rules:
 * - Email must exist
 * - Password must match (bcrypt compare)
 * - Returns JWT access token
 */
@Injectable()
export class SignInUseCase implements IUseCase<SignInInput, SignInOutput> {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: SignInInput): Promise<SignInOutput> {
    this.logger.logUseCase('SignInUseCase', { email: input.email });

    // Find user by email
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      this.logger.logSecurityEvent('Sign in attempt with non-existent email', 'low', {
        email: input.email,
      });
      throw new InvalidCredentialsException();
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    if (!isPasswordValid) {
      this.logger.logSecurityEvent('Sign in attempt with invalid password', 'medium', {
        userId: user.id,
        email: input.email,
      });
      throw new InvalidCredentialsException();
    }

    // Generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const access_token = this.jwtService.sign(payload);

    this.logger.log('User signed in successfully', { userId: user.id, email: user.email, role: user.role });

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }
}
