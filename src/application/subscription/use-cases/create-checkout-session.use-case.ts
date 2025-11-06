import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ISubscriptionRepository } from '@core/domain/repositories/subscription.repository';
import { StripeService } from '@infra/payment/stripe.service';
import { LoggerService } from '@infra/logging/logger.service';

export interface CreateCheckoutSessionInput {
  userId: string;
  coupleId: string;
  userEmail: string;
}

export interface CreateCheckoutSessionOutput {
  sessionUrl: string;
  sessionId: string;
}

@Injectable()
export class CreateCheckoutSessionUseCase implements IUseCase<CreateCheckoutSessionInput, CreateCheckoutSessionOutput> {
  constructor(
    @Inject('ISubscriptionRepository')
    private readonly subscriptionRepository: ISubscriptionRepository,
    private readonly stripeService: StripeService,
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: CreateCheckoutSessionInput): Promise<CreateCheckoutSessionOutput> {
    const { userId, coupleId, userEmail } = input;

    // Get current subscription
    const subscription = await this.subscriptionRepository.findByCoupleId(coupleId);

    if (!subscription) {
      throw new Error('No subscription found for this couple');
    }

    // Get Stripe price ID from config
    const priceId = this.configService.get<string>('STRIPE_PRICE_ID_PREMIUM');

    if (!priceId || priceId.includes('ADICIONE')) {
      throw new Error('Stripe price ID not configured');
    }

    // Build URLs
    const baseUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:5173';
    const successUrl = `${baseUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/billing/canceled`;

    // Create Stripe checkout session
    const session = await this.stripeService.createCheckoutSession({
      coupleId,
      userEmail,
      priceId,
      successUrl,
      cancelUrl,
    });

    this.logger.log('Checkout session created', {
      userId,
      coupleId,
      sessionId: session.id,
    });

    return {
      sessionUrl: session.url || '',
      sessionId: session.id,
    };
  }
}
