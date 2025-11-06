import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infra/database/database.module';
import { LoggingModule } from '@infra/logging/logging.module';
import { GetUserGameProfileUseCase } from './use-cases/get-user-game-profile.use-case';
import { AwardXPUseCase } from './use-cases/award-xp.use-case';
import { GetCoupleRankingUseCase } from './use-cases/get-couple-ranking.use-case';
import { PrismaUserGameProfileRepository } from '@infra/database/prisma/repositories/prisma-user-game-profile.repository';

@Module({
  imports: [DatabaseModule, LoggingModule],
  providers: [
    GetUserGameProfileUseCase,
    AwardXPUseCase,
    GetCoupleRankingUseCase,
    {
      provide: 'IUserGameProfileRepository',
      useClass: PrismaUserGameProfileRepository,
    },
  ],
  exports: [GetUserGameProfileUseCase, AwardXPUseCase, GetCoupleRankingUseCase],
})
export class UserGameProfileModule {}
