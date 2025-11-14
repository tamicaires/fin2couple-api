import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infra/database/database.module';
import { LoggingModule } from '@infra/logging/logging.module';

// Use Cases
import { CreateAccountUseCase } from './useCases/create-account/create-account.use-case';
import { ListAccountsUseCase } from './useCases/list-accounts/list-accounts.use-case';
import { UpdateAccountUseCase } from './useCases/update-account/update-account.use-case';
import { DeleteAccountUseCase } from './useCases/delete-account/delete-account.use-case';
import { ArchiveAccountUseCase } from './useCases/archive-account/archive-account.use-case';

// Repositories
import { PrismaAccountRepository } from '@infra/database/prisma/repositories/prisma-account.repository';
import { PrismaSubscriptionRepository } from '@infra/database/prisma/repositories/prisma-subscription.repository';
import { PrismaPlanRepository } from '@infra/database/prisma/repositories/prisma-plan.repository';
import { PrismaCoupleRepository } from '@infra/database/prisma/repositories/prisma-couple.repository';
import { PrismaTransactionRepository } from '@infra/database/prisma/repositories/prisma-transaction.repository';

@Module({
  imports: [DatabaseModule, LoggingModule],
  providers: [
    // Use Cases
    CreateAccountUseCase,
    ListAccountsUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    ArchiveAccountUseCase,

    // Repositories
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
      provide: 'ICoupleRepository',
      useClass: PrismaCoupleRepository,
    },
  ],
  exports: [
    CreateAccountUseCase,
    ListAccountsUseCase,
    UpdateAccountUseCase,
    DeleteAccountUseCase,
    ArchiveAccountUseCase,
  ],
})
export class AccountModule {}
