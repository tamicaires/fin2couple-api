import { SetMetadata } from '@nestjs/common';

/**
 * @Public() decorator
 * Marks a route as public (bypasses JWT authentication)
 * 
 * Usage:
 * @Post('login')
 * @Public()
 * async login(@Body() dto: SignInDto) {
 *   return this.authService.signIn(dto);
 * }
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
