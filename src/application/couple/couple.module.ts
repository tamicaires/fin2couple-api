import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infra/database/database.module';
import { LoggingModule } from '@infra/logging/logging.module';

// Use Cases
import { CreateCoupleUseCase } from './useCases/create-couple/create-couple.use-case';
import { GetCoupleDashboardUseCase } from './useCases/get-couple-dashboard/get-couple-dashboard.use-case';
import { GetCoupleInfoUseCase } from './useCases/get-couple-info/get-couple-info.use-case';
import { UpdateFreeSpendingUseCase } from './useCases/update-free-spending/update-free-spending.use-case';
import { UpdateCoupleSettingsUseCase } from './useCases/update-couple-settings/update-couple-settings.use-case';
import { UpdateFinancialModelUseCase } from './useCases/update-financial-model/update-financial-model.use-case';
import { CreateInviteUseCase } from './useCases/create-invite/create-invite.use-case';
import { AcceptInviteUseCase } from './useCases/accept-invite/accept-invite.use-case';

// Repositories
import { PrismaCoupleRepository } from '@infra/database/prisma/repositories/prisma-couple.repository';
import { PrismaUserRepository } from '@infra/database/prisma/repositories/prisma-user.repository';
import { PrismaAccountRepository } from '@infra/database/prisma/repositories/prisma-account.repository';
import { PrismaTransactionRepository } from '@infra/database/prisma/repositories/prisma-transaction.repository';
import { PrismaSubscriptionRepository } from '@infra/database/prisma/repositories/prisma-subscription.repository';
import { PrismaPlanRepository } from '@infra/database/prisma/repositories/prisma-plan.repository';
import { PrismaCoupleInviteRepository } from '@infra/database/prisma/repositories/prisma-couple-invite.repository';

@Module({
  imports: [DatabaseModule, LoggingModule],
  providers: [
    // Use Cases
    CreateCoupleUseCase,
    GetCoupleDashboardUseCase,
    GetCoupleInfoUseCase,
    UpdateFreeSpendingUseCase,
    UpdateCoupleSettingsUseCase,
    UpdateFinancialModelUseCase,
    CreateInviteUseCase,
    AcceptInviteUseCase,

    // Repositories
    {
      provide: 'ICoupleRepository',
      useClass: PrismaCoupleRepository,
    },
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
    {
      provide: 'IAccountRepository',
      useClass: PrismaAccountRepository,
    },
    {
      provide: 'ITransactionRepository',
      useClass: PrismaTransactionRepository,
    },
    {
      provide: 'ISubscriptionRepository',
      useClass: PrismaSubscriptionRepository,
    },
    {
      provide: 'IPlanRepository',
      useClass: PrismaPlanRepository,
    },
    {
      provide: 'ICoupleInviteRepository',
      useClass: PrismaCoupleInviteRepository,
    },
  ],
  exports: [
    CreateCoupleUseCase,
    GetCoupleDashboardUseCase,
    GetCoupleInfoUseCase,
    UpdateFreeSpendingUseCase,
    UpdateCoupleSettingsUseCase,
    UpdateFinancialModelUseCase,
    CreateInviteUseCase,
    AcceptInviteUseCase,
  ],
})
export class CoupleModule {}
