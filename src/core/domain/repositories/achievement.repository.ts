import { Achievement } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';

export interface IAchievementRepository {
  findAll(): Promise<Achievement[]>;
  findByKey(key: string): Promise<Achievement | null>;
  findById(id: string): Promise<Achievement | null>;
  findUserAchievements(userId: string): Promise<UserAchievement[]>;
  findUserAchievementsWithDetails(
    userId: string,
  ): Promise<{ achievement: Achievement; achieved_at: Date }[]>;
  userHasAchievement(userId: string, achievementKey: string): Promise<boolean>;
  awardAchievement(
    userId: string,
    achievementId: string,
  ): Promise<UserAchievement>;
  countUserAchievements(userId: string): Promise<number>;
  countUserTransactions(userId: string): Promise<number>;
}
