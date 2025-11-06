import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @CoupleId() decorator
 * Extracts only the couple ID from request (lighter than @CurrentCouple)
 * 
 * Usage:
 * @Get('accounts')
 * @UseGuards(JwtAuthGuard, CoupleGuard)
 * getAccounts(@CoupleId() coupleId: string) {
 *   return this.accountService.findAll(coupleId);
 * }
 */
export const CoupleId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.coupleId as string;
  },
);
