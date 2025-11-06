import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import { PrismaTenantService } from './prisma/prisma-tenant.service';
import { UnitOfWork } from './prisma/unit-of-work';
import { LoggingModule } from '@infra/logging/logging.module';

@Global()
@Module({
  imports: [LoggingModule],
  providers: [PrismaService, PrismaTenantService, UnitOfWork],
  exports: [PrismaService, PrismaTenantService, UnitOfWork],
})
export class DatabaseModule {}
