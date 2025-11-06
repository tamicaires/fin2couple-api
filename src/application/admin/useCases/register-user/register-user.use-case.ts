import { Injectable, Inject } from '@nestjs/common';
import { User, UserRole } from '@core/domain/entities/user.entity';
import { IUserRepository } from '@core/domain/repositories/user.repository';
import { UserAlreadyExistsException } from '@core/exceptions/auth/user-already-exists.exception';
import { LoggerService } from '@infra/logging/logger.service';
import * as bcrypt from 'bcrypt';

export interface RegisterUserByAdminInput {
  name: string;
  email: string;
  password: string;
  reason?: string;
}

export interface RegisterUserByAdminOutput {
  user: User;
}

@Injectable()
export class RegisterUserByAdminUseCase {
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: RegisterUserByAdminInput): Promise<RegisterUserByAdminOutput> {
    // Verificar se o usuário já existe
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new UserAlreadyExistsException(input.email);
    }

    // Hash da senha
    const password_hash = await bcrypt.hash(input.password, 10);

    // Criar novo usuário
    const user = new User({
      name: input.name,
      email: input.email,
      password_hash,
      role: UserRole.USER, // Sempre cria como USER, admin pode ser promovido depois
    });

    await this.userRepository.create(user);

    this.logger.log(
      `Admin registered new user: ${user.email}${input.reason ? ` (Reason: ${input.reason})` : ''}`,
    );

    return { user };
  }
}
