import { randomUUID } from 'crypto';
import { z } from 'zod';
import { SubscriptionStatus } from '@core/enum/subscription-status.enum';

export class Subscription {
  id: string;
  couple_id: string;
  plan_id: string;
  status: SubscriptionStatus;
  start_date: Date;
  end_date: Date | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  created_at: Date;
  updated_at: Date;

  constructor(data: SubscriptionType) {
    const validatedData = subscriptionSchema.parse(data);
    Object.assign(this, validatedData);
    this.id = validatedData.id ?? randomUUID();
    this.start_date = validatedData.start_date ?? new Date();
    this.created_at = validatedData.created_at ?? new Date();
    this.updated_at = validatedData.updated_at ?? new Date();
  }

  // Helper: Check if subscription is active
  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  // Helper: Check if subscription is in trial
  isTrial(): boolean {
    return this.status === SubscriptionStatus.TRIAL;
  }

  // Helper: Check if subscription is valid (active or trial)
  isValid(): boolean {
    return this.isActive() || this.isTrial();
  }

  // Helper: Check if subscription is expired
  isExpired(): boolean {
    if (!this.end_date) return false;
    return new Date() > this.end_date;
  }

  // Helper: Check if subscription is canceled
  isCanceled(): boolean {
    return this.status === SubscriptionStatus.CANCELED;
  }

  // Helper: Get days remaining
  getDaysRemaining(): number | null {
    if (!this.end_date) return null;
    const now = new Date();
    const diffTime = this.end_date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  // Helper: Cancel subscription
  cancel(): void {
    this.status = SubscriptionStatus.CANCELED;
    this.updated_at = new Date();
  }

  // Helper: Activate subscription
  activate(): void {
    this.status = SubscriptionStatus.ACTIVE;
    this.updated_at = new Date();
  }
}

export const subscriptionSchema = z.object({
  id: z.string().uuid().optional(),
  couple_id: z.string().uuid(),
  plan_id: z.string().uuid(),
  status: z.nativeEnum(SubscriptionStatus).default(SubscriptionStatus.TRIAL),
  start_date: z.date().optional(),
  end_date: z.date().nullable().optional(),
  stripe_customer_id: z.string().nullable().optional(),
  stripe_subscription_id: z.string().nullable().optional(),
  stripe_price_id: z.string().nullable().optional(),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type SubscriptionType = z.infer<typeof subscriptionSchema>;
