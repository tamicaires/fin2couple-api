import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infra/database/database.module';
import { LoggingModule } from '@infra/logging/logging.module';
import { PrismaAchievementRepository } from '@infra/database/prisma/repositories/prisma-achievement.repository';
import { PrismaUserGameProfileRepository } from '@infra/database/prisma/repositories/prisma-user-game-profile.repository';
import { CheckAchievementsUseCase } from './use-cases/check-achievements.use-case';
import { GetUserAchievementsUseCase } from './use-cases/get-user-achievements.use-case';

@Module({
  imports: [DatabaseModule, LoggingModule],
  providers: [
    {
      provide: 'IAchievementRepository',
      useClass: PrismaAchievementRepository,
    },
    {
      provide: 'IUserGameProfileRepository',
      useClass: PrismaUserGameProfileRepository,
    },
    CheckAchievementsUseCase,
    GetUserAchievementsUseCase,
  ],
  exports: [
    'IAchievementRepository',
    CheckAchievementsUseCase,
    GetUserAchievementsUseCase,
  ],
})
export class AchievementModule {}
