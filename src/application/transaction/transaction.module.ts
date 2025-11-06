import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { DatabaseModule } from '@infra/database/database.module';
import { LoggingModule } from '@infra/logging/logging.module';

// Use Cases
import { RegisterTransactionUseCase } from './useCases/register-transaction/register-transaction.use-case';
import { ListTransactionsUseCase } from './useCases/list-transactions/list-transactions.use-case';
import { DeleteTransactionUseCase } from './useCases/delete-transaction/delete-transaction.use-case';
import { UpdateFreeSpendingUseCase } from './useCases/update-free-spending/update-free-spending.use-case';
import { CreateInstallmentTransactionUseCase } from './useCases/create-installment-transaction/create-installment-transaction.use-case';
import { CreateRecurringTransactionUseCase } from './useCases/create-recurring-transaction/create-recurring-transaction.use-case';
import { UpdateTransactionUseCase } from './useCases/update-transaction/update-transaction.use-case';
import { GenerateRecurringTransactionsUseCase } from './useCases/generate-recurring-transactions/generate-recurring-transactions.use-case';

// Strategies
import { UpdateSingleStrategy } from './useCases/update-transaction/strategies/update-single.strategy';
import { UpdateInstallmentFutureStrategy } from './useCases/update-transaction/strategies/update-installment-future.strategy';
import { UpdateInstallmentAllStrategy } from './useCases/update-transaction/strategies/update-installment-all.strategy';
import { UpdateRecurringFutureStrategy } from './useCases/update-transaction/strategies/update-recurring-future.strategy';

// Repositories
import { PrismaTransactionRepository } from '@infra/database/prisma/repositories/prisma-transaction.repository';
import { PrismaAccountRepository } from '@infra/database/prisma/repositories/prisma-account.repository';
import { PrismaCoupleRepository } from '@infra/database/prisma/repositories/prisma-couple.repository';
import { PrismaRecurringTransactionTemplateRepository } from '@infra/database/prisma/repositories/prisma-recurring-transaction-template.repository';

@Module({
  imports: [DatabaseModule, LoggingModule, EventEmitterModule],
  providers: [
    // Use Cases
    RegisterTransactionUseCase,
    ListTransactionsUseCase,
    DeleteTransactionUseCase,
    UpdateFreeSpendingUseCase,
    CreateInstallmentTransactionUseCase,
    CreateRecurringTransactionUseCase,
    UpdateTransactionUseCase,
    GenerateRecurringTransactionsUseCase,

    // Strategies
    UpdateSingleStrategy,
    UpdateInstallmentFutureStrategy,
    UpdateInstallmentAllStrategy,
    UpdateRecurringFutureStrategy,

    // Repositories
    {
      provide: 'ITransactionRepository',
      useClass: PrismaTransactionRepository,
    },
    {
      provide: 'IAccountRepository',
      useClass: PrismaAccountRepository,
    },
    {
      provide: 'ICoupleRepository',
      useClass: PrismaCoupleRepository,
    },
    {
      provide: 'IRecurringTransactionTemplateRepository',
      useClass: PrismaRecurringTransactionTemplateRepository,
    },
  ],
  exports: [
    RegisterTransactionUseCase,
    ListTransactionsUseCase,
    DeleteTransactionUseCase,
    UpdateFreeSpendingUseCase,
    CreateInstallmentTransactionUseCase,
    CreateRecurringTransactionUseCase,
    UpdateTransactionUseCase,
    GenerateRecurringTransactionsUseCase,
    'IRecurringTransactionTemplateRepository',
  ],
})
export class TransactionModule {}
