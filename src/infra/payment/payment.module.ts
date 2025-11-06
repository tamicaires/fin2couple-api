import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LoggingModule } from '@infra/logging/logging.module';
import { DatabaseModule } from '@infra/database/database.module';
import { StripeService } from './stripe.service';
import { CreateCheckoutSessionUseCase } from '@application/subscription/use-cases/create-checkout-session.use-case';
import { GetSubscriptionStatusUseCase } from '@application/subscription/use-cases/get-subscription-status.use-case';
import { HandleWebhookUseCase } from '@application/subscription/use-cases/handle-webhook.use-case';
import { CreatePortalSessionUseCase } from '@application/subscription/use-cases/create-portal-session.use-case';
import { SubscriptionController } from '@presenters/http/controllers/subscription.controller';
import { PrismaSubscriptionRepository } from '@infra/database/prisma/repositories/prisma-subscription.repository';
import { PrismaPlanRepository } from '@infra/database/prisma/repositories/prisma-plan.repository';

@Module({
  imports: [ConfigModule, LoggingModule, DatabaseModule, EventEmitterModule],
  providers: [
    StripeService,
    // Repository providers
    { provide: 'ISubscriptionRepository', useClass: PrismaSubscriptionRepository },
    { provide: 'IPlanRepository', useClass: PrismaPlanRepository },
    // Use cases
    CreateCheckoutSessionUseCase,
    GetSubscriptionStatusUseCase,
    HandleWebhookUseCase,
    CreatePortalSessionUseCase,
  ],
  controllers: [SubscriptionController],
  exports: [StripeService],
})
export class PaymentModule {}
