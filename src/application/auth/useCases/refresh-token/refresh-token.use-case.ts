import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { LoggerService } from '@infra/logging/logger.service';
import { UserNotFoundException } from '@core/exceptions/user/user-not-found.exception';

interface RefreshTokenInput {
  userId: string;
}

interface RefreshTokenOutput {
  access_token: string;
  user: {
    id: string;
    name: string;
    email: string;
    has_couple: boolean;
  };
}

@Injectable()
export class RefreshTokenUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenOutput> {
    const { userId } = input;

    // Find user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UserNotFoundException(userId);
    }

    // Check if user is in a couple
    const couple = await this.prisma.couple.findFirst({
      where: {
        OR: [{ user_id_a: user.id }, { user_id_b: user.id }],
      },
    });

    const has_couple = !!couple;

    // Generate new token with updated information
    const payload = {
      sub: user.id,
      email: user.email,
      has_couple,
    };

    const access_token = await this.jwtService.signAsync(payload);

    this.logger.log('Token refreshed successfully', {
      userId: user.id,
      has_couple,
    });

    return {
      access_token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        has_couple,
      },
    };
  }
}
