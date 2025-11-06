import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { LoggerService } from '@infra/logging/logger.service';

@Injectable()
export class StripeService implements OnModuleInit {
  private stripe: Stripe;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  onModuleInit() {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');

    if (!secretKey || secretKey.includes('ADICIONE')) {
      this.logger.warn('Stripe not configured - payment features will be disabled');
      return;
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2025-09-30.clover',
    });

    this.logger.log('Stripe initialized successfully');
  }

  async createCheckoutSession(params: {
    coupleId: string;
    userEmail: string;
    priceId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<Stripe.Checkout.Session> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: params.userEmail,
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      metadata: {
        coupleId: params.coupleId,
      },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    });

    this.logger.log('Checkout session created', {
      sessionId: session.id,
      coupleId: params.coupleId,
    });

    return session;
  }

  async createCustomerPortalSession(params: {
    customerId: string;
    returnUrl: string;
  }): Promise<Stripe.BillingPortal.Session> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    });

    this.logger.log('Customer portal session created', {
      sessionId: session.id,
      customerId: params.customerId,
    });

    return session;
  }

  async cancelSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    const subscription = await this.stripe.subscriptions.cancel(subscriptionId);

    this.logger.log('Subscription canceled', {
      subscriptionId: subscription.id,
    });

    return subscription;
  }

  async constructWebhookEvent(
    body: string | Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    if (!webhookSecret || webhookSecret.includes('ADICIONE')) {
      throw new Error('Stripe webhook secret not configured');
    }

    return this.stripe.webhooks.constructEvent(body, signature, webhookSecret);
  }

  async getSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return this.stripe.subscriptions.retrieve(subscriptionId);
  }

  async getCustomer(customerId: string): Promise<Stripe.Customer> {
    if (!this.stripe) {
      throw new Error('Stripe not configured');
    }

    return this.stripe.customers.retrieve(customerId) as Promise<Stripe.Customer>;
  }
}
