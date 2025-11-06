import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UserRole } from '@core/domain/entities/user.entity';

/**
 * Admin Guard
 *
 * Protects routes that require admin access
 * Must be used after JwtAuthGuard
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return true;
  }
}
