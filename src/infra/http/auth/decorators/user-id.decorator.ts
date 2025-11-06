import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '@shared/types/authenticated-user.type';

/**
 * @UserId() decorator
 * Extracts user ID from authenticated user in request
 *
 * Usage:
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@UserId() userId: string) {
 *   return { userId };
 * }
 */
export const UserId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    return user?.id;
  },
);
