import { randomUUID } from 'node:crypto';
import { z } from 'zod';

export class UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  achieved_at: Date;

  constructor(data: UserAchievementEntityType) {
    const validatedData = userAchievementSchema.parse(data);
    Object.assign(this, validatedData);
    this.id = validatedData.id ?? randomUUID();
    this.achieved_at = validatedData.achieved_at ?? new Date();
  }
}

export const userAchievementSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  achievement_id: z.string().uuid(),
  achieved_at: z.date().optional(),
});

export type UserAchievementEntityType = z.infer<typeof userAchievementSchema>;
