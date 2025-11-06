import { Subscription } from '../entities/subscription.entity';
import { SubscriptionStatus } from '@core/enum/subscription-status.enum';

/**
 * Subscription Repository Interface (Contract)
 *
 * Manages couple subscriptions and plan limits
 */
export interface ISubscriptionRepository {
  findById(id: string): Promise<Subscription | null>;
  findByCoupleId(coupleId: string): Promise<Subscription | null>;
  findActiveByCoupleId(coupleId: string): Promise<Subscription | null>;
  findByPlanId(planId: string): Promise<Subscription[]>;
  findByStatus(status: SubscriptionStatus): Promise<Subscription[]>;
  create(subscription: Subscription): Promise<Subscription>;
  update(id: string, data: Partial<Subscription>): Promise<Subscription>;
  delete(id: string): Promise<void>;

  // Business queries
  findExpiredSubscriptions(): Promise<Subscription[]>;
  findTrialEndingSoon(days: number): Promise<Subscription[]>;

  // Stripe integration
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<Subscription | null>;
  findByStripeCustomerId(stripeCustomerId: string): Promise<Subscription | null>;

  // Status operations
  updateStatus(id: string, status: SubscriptionStatus): Promise<void>;
  cancel(id: string): Promise<void>;
  activate(id: string): Promise<void>;
}
