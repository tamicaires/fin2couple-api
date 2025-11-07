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
import { GenerateRecurringOccurrencesUseCase } from '@application/recurring-occurrence/useCases/generate-recurring-occurrences/generate-recurring-occurrences.use-case';
import { PayRecurringOccurrenceUseCase } from '@application/recurring-occurrence/useCases/pay-recurring-occurrence/pay-recurring-occurrence.use-case';
import { CreateInstallmentTemplateUseCase } from '@application/installment/useCases/create-installment-template/create-installment-template.use-case';
import { PayInstallmentUseCase } from '@application/installment/useCases/pay-installment/pay-installment.use-case';

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
import { PrismaRecurringOccurrenceRepository } from '@infra/database/prisma/repositories/prisma-recurring-occurrence.repository';
import { PrismaInstallmentTemplateRepository } from '@infra/database/prisma/repositories/prisma-installment-template.repository';
import { PrismaInstallmentRepository } from '@infra/database/prisma/repositories/prisma-installment.repository';

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
    GenerateRecurringOccurrencesUseCase,
    PayRecurringOccurrenceUseCase,
    CreateInstallmentTemplateUseCase,
    PayInstallmentUseCase,

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
    {
      provide: 'IRecurringOccurrenceRepository',
      useClass: PrismaRecurringOccurrenceRepository,
    },
    {
      provide: 'IInstallmentTemplateRepository',
      useClass: PrismaInstallmentTemplateRepository,
    },
    {
      provide: 'IInstallmentRepository',
      useClass: PrismaInstallmentRepository,
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
    GenerateRecurringOccurrencesUseCase,
    PayRecurringOccurrenceUseCase,
    CreateInstallmentTemplateUseCase,
    PayInstallmentUseCase,
    'IRecurringTransactionTemplateRepository',
    'IRecurringOccurrenceRepository',
    'IInstallmentTemplateRepository',
    'IInstallmentRepository',
  ],
})
export class TransactionModule {}
