import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database/prisma/prisma.service';
import { LoggerService } from '@infra/logging/logger.service';

export interface AssignPlanToCoupleInput {
  coupleId: string;
  planName: string;
  durationDays?: number; // null = unlimited
  reason?: string;
}

export interface AssignPlanToCoupleOutput {
  success: boolean;
  subscription: {
    id: string;
    plan_name: string;
    status: string;
    end_date: Date | null;
  };
}

/**
 * Assign Plan to Couple Use Case
 *
 * Admin can assign any plan to a couple with custom duration.
 * Used to grant free access, extend trials, or change plans.
 */
@Injectable()
export class AssignPlanToCoupleUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: AssignPlanToCoupleInput): Promise<AssignPlanToCoupleOutput> {
    this.logger.log(`[AssignPlanToCoupleUseCase] Assigning plan ${input.planName} to couple ${input.coupleId}`);

    // Find the plan
    const plan = await this.prisma.plan.findUnique({
      where: { name: input.planName },
    });

    if (!plan) {
      throw new Error(`Plan ${input.planName} not found`);
    }

    // Check if couple exists
    const couple = await this.prisma.couple.findUnique({
      where: { id: input.coupleId },
    });

    if (!couple) {
      throw new Error(`Couple ${input.coupleId} not found`);
    }

    // Calculate end date
    const startDate = new Date();
    const endDate = input.durationDays
      ? new Date(startDate.getTime() + input.durationDays * 24 * 60 * 60 * 1000)
      : null; // null = unlimited

    // Upsert subscription
    const subscription = await this.prisma.subscription.upsert({
      where: { couple_id: input.coupleId },
      create: {
        couple_id: input.coupleId,
        plan_id: plan.id,
        status: 'ACTIVE',
        start_date: startDate,
        end_date: endDate,
      },
      update: {
        plan_id: plan.id,
        status: 'ACTIVE',
        start_date: startDate,
        end_date: endDate,
      },
    });

    this.logger.log(
      `[AssignPlanToCoupleUseCase] Assigned ${input.planName} to couple ${input.coupleId}. ` +
      `End date: ${endDate ? endDate.toISOString() : 'unlimited'}. Reason: ${input.reason || 'none'}`,
    );

    return {
      success: true,
      subscription: {
        id: subscription.id,
        plan_name: plan.name,
        status: subscription.status,
        end_date: endDate,
      },
    };
  }
}
