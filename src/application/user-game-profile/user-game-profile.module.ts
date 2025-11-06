import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infra/database/database.module';
import { LoggingModule } from '@infra/logging/logging.module';
import { GetUserGameProfileUseCase } from './use-cases/get-user-game-profile.use-case';
import { AwardXPUseCase } from './use-cases/award-xp.use-case';
import { UpdateStreakUseCase } from './use-cases/update-streak.use-case';
import { GetCoupleRankingUseCase } from './use-cases/get-couple-ranking.use-case';
import { PrismaUserGameProfileRepository } from '@infra/database/prisma/repositories/prisma-user-game-profile.repository';
import { PrismaCoupleRepository } from '@infra/database/prisma/repositories/prisma-couple.repository';
import { PrismaUserRepository } from '@infra/database/prisma/repositories/prisma-user.repository';

@Module({
  imports: [DatabaseModule, LoggingModule],
  providers: [
    GetUserGameProfileUseCase,
    AwardXPUseCase,
    UpdateStreakUseCase,
    GetCoupleRankingUseCase,
    {
      provide: 'IUserGameProfileRepository',
      useClass: PrismaUserGameProfileRepository,
    },
    {
      provide: 'ICoupleRepository',
      useClass: PrismaCoupleRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
  ],
  exports: [
    GetUserGameProfileUseCase,
    AwardXPUseCase,
    UpdateStreakUseCase,
    GetCoupleRankingUseCase,
  ],
})
export class UserGameProfileModule {}
