import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISubscriptionRepository } from '@core/domain/repositories/subscription.repository';
import { StripeService } from '@infra/payment/stripe.service';
import { LoggerService } from '@infra/logging/logger.service';
import { IUseCase } from '@shared/protocols/use-case.interface';

export interface CreatePortalSessionInput {
  coupleId: string;
}

export interface CreatePortalSessionOutput {
  portalUrl: string;
}

@Injectable()
export class CreatePortalSessionUseCase implements IUseCase<CreatePortalSessionInput, CreatePortalSessionOutput> {
  constructor(
    @Inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: CreatePortalSessionInput): Promise<CreatePortalSessionOutput> {
    const { coupleId } = input;

    // Get subscription
    const subscription = await this.subscriptionRepository.findByCoupleId(coupleId);

    if (!subscription) {
      throw new Error('No subscription found for this couple');
    }

    if (!subscription.stripe_customer_id) {
      throw new Error('No Stripe customer ID found - cannot access billing portal');
    }

    // Build return URL
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const returnUrl = `${baseUrl}/billing`;

    // Create Stripe customer portal session
    const session = await this.stripeService.createCustomerPortalSession({
      customerId: subscription.stripe_customer_id,
      returnUrl,
    });

    this.logger.log('Customer portal session created', {
      coupleId,
      customerId: subscription.stripe_customer_id,
    });

    return {
      portalUrl: session.url,
    };
  }
}
