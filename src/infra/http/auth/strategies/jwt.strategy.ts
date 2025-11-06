import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload, AuthenticatedUser } from '@shared/types/authenticated-user.type';

/**
 * JWT Strategy for Passport
 * 
 * Validates JWT token and extracts user payload
 * Sets request.user with authenticated user data
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'your-super-secret-jwt-key-change-in-production',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: payload.sub,
      email: payload.email,
      name: payload.email.split('@')[0], // Temporary until we fetch from DB
      role: payload.role || 'USER',
    };
  }
}
