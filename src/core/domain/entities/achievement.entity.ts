import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export enum AchievementCategory {
  TRANSACTIONS = 'TRANSACTIONS',
  STREAK = 'STREAK',
  BUDGET = 'BUDGET',
  LEVEL = 'LEVEL',
  SAVINGS = 'SAVINGS',
}

export class Achievement {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  category: AchievementCategory;
  created_at: Date;

  constructor(data: AchievementEntityType) {
    const validatedData = achievementSchema.parse(data);
    Object.assign(this, validatedData);
    this.id = validatedData.id ?? randomUUID();
    this.created_at = validatedData.created_at ?? new Date();
  }
}

export const achievementSchema = z.object({
  id: z.string().uuid().optional(),
  key: z.string().min(1).max(100),
  name: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  icon: z.string().min(1).max(50),
  xp_reward: z.number().int().min(0),
  category: z.nativeEnum(AchievementCategory),
  created_at: z.date().optional(),
});

export type AchievementEntityType = z.infer<typeof achievementSchema>;
