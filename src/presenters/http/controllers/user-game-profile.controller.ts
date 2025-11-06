import { Controller, Get, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GetUserGameProfileUseCase } from '@application/user-game-profile/use-cases/get-user-game-profile.use-case';
import { AwardXPUseCase } from '@application/user-game-profile/use-cases/award-xp.use-case';
import { GetCoupleRankingUseCase } from '@application/user-game-profile/use-cases/get-couple-ranking.use-case';
import { JwtAuthGuard } from '@infra/http/auth/guards/jwt-auth.guard';
import { CoupleGuard } from '@infra/http/auth/guards/couple.guard';
import { UserId } from '@infra/http/auth/decorators/user-id.decorator';
import { CoupleId } from '@infra/http/auth/decorators/couple-id.decorator';
import { IsNumber, IsString, Min } from 'class-validator';

class AwardXPDto {
  @IsNumber()
  @Min(1)
  amount: number;

  @IsString()
  reason: string;
}

@ApiTags('Gamification')
@Controller('gamification/profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserGameProfileController {
  constructor(
    private readonly getUserGameProfileUseCase: GetUserGameProfileUseCase,
    private readonly awardXPUseCase: AwardXPUseCase,
    private readonly getCoupleRankingUseCase: GetCoupleRankingUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user game profile (XP, level, streak)' })
  async getProfile(@UserId() userId: string) {
    return await this.getUserGameProfileUseCase.execute({ userId });
  }

  @Get('couple-ranking')
  @UseGuards(CoupleGuard)
  @ApiOperation({ summary: 'Get couple ranking (compare both users)' })
  async getCoupleRanking(@UserId() userId: string, @CoupleId() coupleId: string) {
    return await this.getCoupleRankingUseCase.execute({ userId, coupleId });
  }

  @Post('award-xp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Award XP to user (internal use)' })
  async awardXP(@UserId() userId: string, @Body() dto: AwardXPDto) {
    return await this.awardXPUseCase.execute({
      userId,
      amount: dto.amount,
      reason: dto.reason,
    });
  }
}
