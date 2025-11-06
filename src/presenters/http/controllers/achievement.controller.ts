import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@infra/http/auth/guards/jwt-auth.guard';
import { UserId } from '@infra/http/auth/decorators/user-id.decorator';
import { GetUserAchievementsUseCase } from '@application/achievement/use-cases/get-user-achievements.use-case';

@ApiTags('Achievements')
@Controller('achievements')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AchievementController {
  constructor(
    private readonly getUserAchievementsUseCase: GetUserAchievementsUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get user achievements' })
  async getUserAchievements(@UserId() userId: string) {
    return this.getUserAchievementsUseCase.execute({ userId });
  }
}
