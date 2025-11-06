import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Couple } from '@core/domain/entities/couple.entity';

/**
 * @CurrentCouple() decorator
 * Extracts couple from request (set by CoupleGuard)
 * 
 * Usage:
 * @Get('dashboard')
 * @UseGuards(JwtAuthGuard, CoupleGuard)
 * getDashboard(@CurrentCouple() couple: Couple) {
 *   return couple;
 * }
 */
export const CurrentCouple = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Couple => {
    const request = ctx.switchToHttp().getRequest();
    return request.couple as Couple;
  },
);
