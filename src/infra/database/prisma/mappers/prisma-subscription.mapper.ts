import { Subscription as PrismaSubscription, SubscriptionStatus as PrismaSubscriptionStatus } from '@prisma/client';
import { Subscription } from '@core/domain/entities/subscription.entity';
import { SubscriptionStatus } from '@core/enum/subscription-status.enum';

/**
 * Prisma Subscription Mapper
 */
export class PrismaSubscriptionMapper {
  static toDomain(prismaSubscription: PrismaSubscription): Subscription {
    return new Subscription({
      id: prismaSubscription.id,
      couple_id: prismaSubscription.couple_id,
      plan_id: prismaSubscription.plan_id,
      status: prismaSubscription.status as SubscriptionStatus,
      start_date: prismaSubscription.start_date,
      end_date: prismaSubscription.end_date,
      stripe_customer_id: prismaSubscription.stripe_customer_id,
      stripe_subscription_id: prismaSubscription.stripe_subscription_id,
      stripe_price_id: prismaSubscription.stripe_price_id,
      created_at: prismaSubscription.created_at,
      updated_at: prismaSubscription.updated_at,
    });
  }

  static toPrisma(subscription: Subscription): Omit<PrismaSubscription, 'created_at' | 'updated_at'> {
    return {
      id: subscription.id,
      couple_id: subscription.couple_id,
      plan_id: subscription.plan_id,
      status: subscription.status as PrismaSubscriptionStatus,
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      stripe_customer_id: subscription.stripe_customer_id || null,
      stripe_subscription_id: subscription.stripe_subscription_id || null,
      stripe_price_id: subscription.stripe_price_id || null,
    };
  }
}
