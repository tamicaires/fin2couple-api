import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '@shared/types/authenticated-user.type';

/**
 * @CurrentUser() decorator
 * Extracts authenticated user from request (set by JwtAuthGuard)
 * 
 * Usage:
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * getProfile(@CurrentUser() user: AuthenticatedUser) {
 *   return user;
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext): AuthenticatedUser | string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    // Return specific field if requested
    return data ? user?.[data] : user;
  },
);
