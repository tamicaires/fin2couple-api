import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ISubscriptionRepository } from '@core/domain/repositories/subscription.repository';
import { Subscription } from '@core/domain/entities/subscription.entity';
import { PrismaSubscriptionMapper } from '../mappers/prisma-subscription.mapper';
import { SubscriptionStatus } from '@core/enum/subscription-status.enum';

@Injectable()
export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
    });

    return subscription ? PrismaSubscriptionMapper.toDomain(subscription) : null;
  }

  async findByCoupleId(coupleId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { couple_id: coupleId },
    });

    return subscription ? PrismaSubscriptionMapper.toDomain(subscription) : null;
  }

  async findActiveByCoupleId(coupleId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        couple_id: coupleId,
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
        },
      },
    });

    return subscription ? PrismaSubscriptionMapper.toDomain(subscription) : null;
  }

  async findByPlanId(planId: string): Promise<Subscription[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { plan_id: planId },
    });

    return subscriptions.map(PrismaSubscriptionMapper.toDomain);
  }

  async findByStatus(status: SubscriptionStatus): Promise<Subscription[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status },
    });

    return subscriptions.map(PrismaSubscriptionMapper.toDomain);
  }

  async create(subscription: Subscription): Promise<Subscription> {
    const created = await this.prisma.subscription.create({
      data: PrismaSubscriptionMapper.toPrisma(subscription),
    });

    return PrismaSubscriptionMapper.toDomain(created);
  }

  async update(id: string, data: Partial<Subscription>): Promise<Subscription> {
    const updated = await this.prisma.subscription.update({
      where: { id },
      data,
    });

    return PrismaSubscriptionMapper.toDomain(updated);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.subscription.delete({
      where: { id },
    });
  }

  async findExpiredSubscriptions(): Promise<Subscription[]> {
    const now = new Date();

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        end_date: {
          lte: now,
        },
        status: {
          in: [SubscriptionStatus.ACTIVE, SubscriptionStatus.TRIAL],
        },
      },
    });

    return subscriptions.map(PrismaSubscriptionMapper.toDomain);
  }

  async findTrialEndingSoon(days: number): Promise<Subscription[]> {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + days);

    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.TRIAL,
        end_date: {
          gte: now,
          lte: futureDate,
        },
      },
    });

    return subscriptions.map(PrismaSubscriptionMapper.toDomain);
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripe_subscription_id: stripeSubscriptionId },
    });

    return subscription ? PrismaSubscriptionMapper.toDomain(subscription) : null;
  }

  async findByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { stripe_customer_id: stripeCustomerId },
    });

    return subscription ? PrismaSubscriptionMapper.toDomain(subscription) : null;
  }

  async updateStatus(id: string, status: SubscriptionStatus): Promise<void> {
    await this.prisma.subscription.update({
      where: { id },
      data: { status },
    });
  }

  async cancel(id: string): Promise<void> {
    await this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELED },
    });
  }

  async activate(id: string): Promise<void> {
    await this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.ACTIVE },
    });
  }
}
