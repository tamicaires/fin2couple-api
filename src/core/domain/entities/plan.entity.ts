import { randomUUID } from 'crypto';
import { z } from 'zod';

export class Plan {
  id: string;
  name: string;
  price_monthly: number;
  max_accounts: number;
  max_transactions_month: number;
  features: Record<string, boolean>;
  created_at: Date;

  constructor(data: PlanType) {
    const validatedData = planSchema.parse(data);
    Object.assign(this, validatedData);
    this.id = validatedData.id ?? randomUUID();
    this.created_at = validatedData.created_at ?? new Date();
  }

  // Helper: Check if a feature is enabled
  hasFeature(featureName: string): boolean {
    return this.features[featureName] === true;
  }

  // Helper: Check if account limit is reached
  canCreateAccount(currentAccountCount: number): boolean {
    return currentAccountCount < this.max_accounts;
  }

  // Helper: Check if transaction limit is reached
  canCreateTransaction(currentTransactionCount: number): boolean {
    return currentTransactionCount < this.max_transactions_month;
  }

  // Helper: Check if plan is free
  isFree(): boolean {
    return this.price_monthly === 0;
  }

  // Helper: Get formatted price
  getFormattedPrice(): string {
    if (this.isFree()) return 'Free';
    return `R$ ${this.price_monthly.toFixed(2)}/month`;
  }

  // Helper: Get feature list as array
  getFeatureList(): string[] {
    return Object.keys(this.features).filter((key) => this.features[key]);
  }
}

export const planSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1),
  price_monthly: z.number().min(0),
  max_accounts: z.number().int().positive().default(5),
  max_transactions_month: z.number().int().positive().default(100),
  features: z.record(z.string(), z.boolean()).default({}),
  created_at: z.date().optional(),
});

export type PlanType = z.infer<typeof planSchema>;
