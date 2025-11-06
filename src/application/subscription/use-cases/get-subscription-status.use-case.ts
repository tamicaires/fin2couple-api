import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ISubscriptionRepository } from '@core/domain/repositories/subscription.repository';
import { IPlanRepository } from '@core/domain/repositories/plan.repository';
import { StripeService } from '@infra/payment/stripe.service';
import { LoggerService } from '@infra/logging/logger.service';
import { SubscriptionStatus } from '@core/enum/subscription-status.enum';

export interface GetSubscriptionStatusInput {
  coupleId: string;
}

export interface GetSubscriptionStatusOutput {
  status: SubscriptionStatus;
  planName: string;
  startDate: Date;
  endDate: Date | null;
  daysRemaining: number | null;
  canUpgrade: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
}

@Injectable()
export class GetSubscriptionStatusUseCase implements IUseCase<GetSubscriptionStatusInput, GetSubscriptionStatusOutput> {
  constructor(
    @Inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject('IPlanRepository')
    private readonly planRepository: IPlanRepository,
    private readonly stripeService: StripeService,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: GetSubscriptionStatusInput): Promise<GetSubscriptionStatusOutput> {
    const { coupleId } = input;

    // Get subscription
    const subscription = await this.subscriptionRepository.findByCoupleId(coupleId);

    if (!subscription) {
      throw new Error('No subscription found for this couple');
    }

    // Get plan details
    const plan = await this.planRepository.findById(subscription.plan_id);

    if (!plan) {
      throw new Error('Plan not found');
    }

    // Calculate days remaining
    const daysRemaining = subscription.end_date
      ? Math.max(0, Math.ceil((subscription.end_date.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
      : null;

    // Check if can upgrade (not already on premium and not active)
    const canUpgrade = plan.name !== 'Premium' && subscription.status !== SubscriptionStatus.ACTIVE;

    // If has Stripe subscription, sync status
    if (subscription.stripe_subscription_id) {
      try {
        const stripeSubscription = await this.stripeService.getSubscription(subscription.stripe_subscription_id);

        // Update status if it changed in Stripe
        if (stripeSubscription.status === 'active' && subscription.status !== SubscriptionStatus.ACTIVE) {
          subscription.activate();
          await this.subscriptionRepository.update(subscription.id, subscription);
        } else if (stripeSubscription.status === 'canceled' && subscription.status !== SubscriptionStatus.CANCELED) {
          subscription.cancel();
          await this.subscriptionRepository.update(subscription.id, subscription);
        }
      } catch (error) {
        this.logger.warn('Failed to sync Stripe subscription status', {
          coupleId,
          subscriptionId: subscription.stripe_subscription_id,
          error: (error as Error).message,
        });
      }
    }

    this.logger.log('Subscription status retrieved', {
      coupleId,
      status: subscription.status,
      planName: plan.name,
    });

    return {
      status: subscription.status,
      planName: plan.name,
      startDate: subscription.start_date,
      endDate: subscription.end_date,
      daysRemaining,
      canUpgrade,
      stripeCustomerId: subscription.stripe_customer_id,
      stripeSubscriptionId: subscription.stripe_subscription_id,
    };
  }
}
