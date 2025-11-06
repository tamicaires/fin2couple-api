import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infra/database/database.module';
import { LoggingModule } from '@infra/logging/logging.module';
import { PrismaUserRepository } from '@infra/database/prisma/repositories/prisma-user.repository';
import { PrismaCoupleRepository } from '@infra/database/prisma/repositories/prisma-couple.repository';

// Use Cases
import { ListAllUsersUseCase } from './useCases/list-all-users/list-all-users.use-case';
import { UpdateUserEmailUseCase } from './useCases/update-user-email/update-user-email.use-case';
import { LinkCoupleUseCase } from './useCases/link-couple/link-couple.use-case';
import { UnlinkCoupleUseCase } from './useCases/unlink-couple/unlink-couple.use-case';
import { RegisterUserByAdminUseCase } from './useCases/register-user/register-user.use-case';
import { AssignPlanToCoupleUseCase } from './useCases/assign-plan-to-couple/assign-plan-to-couple.use-case';

@Module({
  imports: [DatabaseModule, LoggingModule],
  providers: [
    {
      provide: 'IUserRepository',
      useClass: PrismaUserRepository,
    },
    {
      provide: 'ICoupleRepository',
      useClass: PrismaCoupleRepository,
    },
    ListAllUsersUseCase,
    UpdateUserEmailUseCase,
    LinkCoupleUseCase,
    UnlinkCoupleUseCase,
    RegisterUserByAdminUseCase,
    AssignPlanToCoupleUseCase,
  ],
  exports: [
    ListAllUsersUseCase,
    UpdateUserEmailUseCase,
    LinkCoupleUseCase,
    UnlinkCoupleUseCase,
    RegisterUserByAdminUseCase,
    AssignPlanToCoupleUseCase,
  ],
})
export class AdminModule {}
