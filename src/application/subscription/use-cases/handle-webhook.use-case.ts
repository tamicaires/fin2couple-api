import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ISubscriptionRepository } from '@core/domain/repositories/subscription.repository';
import { IPlanRepository } from '@core/domain/repositories/plan.repository';
import { StripeService } from '@infra/payment/stripe.service';
import { LoggerService } from '@infra/logging/logger.service';
import Stripe from 'stripe';

export interface HandleWebhookInput {
  body: string | Buffer;
  signature: string;
}

export interface HandleWebhookOutput {
  processed: boolean;
  eventType: string;
}

@Injectable()
export class HandleWebhookUseCase implements IUseCase<HandleWebhookInput, HandleWebhookOutput> {
  constructor(
    @Inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject('IPlanRepository')
    private readonly planRepository: IPlanRepository,
    private readonly stripeService: StripeService,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: HandleWebhookInput): Promise<HandleWebhookOutput> {
    const { body, signature } = input;

    // Verify webhook signature
    const event = await this.stripeService.constructWebhookEvent(body, signature);

    this.logger.log('Stripe webhook received', {
      eventType: event.type,
      eventId: event.id,
    });

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionCanceled(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        this.logger.log('Unhandled webhook event type', { eventType: event.type });
    }

    return {
      processed: true,
      eventType: event.type,
    };
  }

  private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const coupleId = session.metadata?.coupleId;

    if (!coupleId) {
      this.logger.warn('No coupleId in checkout session metadata', {
        sessionId: session.id,
      });
      return;
    }

    // Get subscription from database
    const subscription = await this.subscriptionRepository.findByCoupleId(coupleId);

    if (!subscription) {
      this.logger.warn('No subscription found for couple', { coupleId });
      return;
    }

    // Get premium plan
    const premiumPlan = await this.planRepository.findByName('Premium');

    if (!premiumPlan) {
      this.logger.error('Premium plan not found in database');
      return;
    }

    // Update subscription with Stripe data
    subscription.stripe_customer_id = session.customer as string;
    subscription.stripe_subscription_id = session.subscription as string;
    subscription.stripe_price_id = session.line_items?.data[0]?.price?.id || null;
    subscription.plan_id = premiumPlan.id;
    subscription.activate();

    await this.subscriptionRepository.update(subscription.id, subscription);

    this.logger.log('Checkout completed - subscription upgraded', {
      coupleId,
      subscriptionId: subscription.id,
      stripeSubscriptionId: subscription.stripe_subscription_id,
    });

    // Emit event for potential bonus XP/achievements
    this.eventEmitter.emit('subscription.upgraded', {
      coupleId,
      planName: 'Premium',
    });
  }

  private async handleSubscriptionUpdated(stripeSubscription: Stripe.Subscription) {
    const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(
      stripeSubscription.id,
    );

    if (!subscription) {
      this.logger.warn('No subscription found for Stripe subscription ID', {
        stripeSubscriptionId: stripeSubscription.id,
      });
      return;
    }

    // Update status based on Stripe status
    if (stripeSubscription.status === 'active') {
      subscription.activate();
    } else if (stripeSubscription.status === 'canceled') {
      subscription.cancel();
    }

    // Update end date based on current period end
    if ('current_period_end' in stripeSubscription && typeof stripeSubscription.current_period_end === 'number') {
      subscription.end_date = new Date(stripeSubscription.current_period_end * 1000);
    }

    await this.subscriptionRepository.update(subscription.id, subscription);

    this.logger.log('Subscription updated from Stripe', {
      subscriptionId: subscription.id,
      status: subscription.status,
    });
  }

  private async handleSubscriptionCanceled(stripeSubscription: Stripe.Subscription) {
    const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(
      stripeSubscription.id,
    );

    if (!subscription) {
      this.logger.warn('No subscription found for Stripe subscription ID', {
        stripeSubscriptionId: stripeSubscription.id,
      });
      return;
    }

    subscription.cancel();
    await this.subscriptionRepository.update(subscription.id, subscription);

    this.logger.log('Subscription canceled', {
      subscriptionId: subscription.id,
      coupleId: subscription.couple_id,
    });

    this.eventEmitter.emit('subscription.canceled', {
      coupleId: subscription.couple_id,
    });
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    this.logger.log('Payment succeeded', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amount: invoice.amount_paid,
    });

    // Could emit event for bonus XP or notification
    if ('subscription' in invoice && invoice.subscription) {
      const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(
        invoice.subscription as string,
      );

      if (subscription) {
        this.eventEmitter.emit('payment.succeeded', {
          coupleId: subscription.couple_id,
          amount: invoice.amount_paid / 100, // Convert cents to dollars
        });
      }
    }
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice) {
    this.logger.warn('Payment failed', {
      invoiceId: invoice.id,
      customerId: invoice.customer,
      amount: invoice.amount_due,
    });

    // Could send notification to user
    if ('subscription' in invoice && invoice.subscription) {
      const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(
        invoice.subscription as string,
      );

      if (subscription) {
        this.eventEmitter.emit('payment.failed', {
          coupleId: subscription.couple_id,
          amount: invoice.amount_due / 100,
        });
      }
    }
  }
}
