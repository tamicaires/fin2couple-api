import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { InvalidCredentialsException } from '@core/exceptions/auth/invalid-credentials.exception';
import { ValidateUserUseCase } from '@application/auth/useCases/validate-user/validate-user.use-case';
import { User } from '@core/domain/entities/user.entity';

/**
 * Local Strategy for Passport (Email/Password login)
 *
 * Used by Passport for email/password authentication
 * Delegates to ValidateUserUseCase for business logic
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly validateUserUseCase: ValidateUserUseCase) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  async validate(email: string, password: string): Promise<User> {
    const user = await this.validateUserUseCase.execute({ email, password });

    if (!user) {
      throw new InvalidCredentialsException();
    }

    return user;
  }
}
