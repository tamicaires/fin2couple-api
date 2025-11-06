import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IAchievementRepository } from '@core/domain/repositories/achievement.repository';
import {
  Achievement,
  AchievementCategory,
} from '@core/domain/entities/achievement.entity';
import { UserAchievement } from '@core/domain/entities/user-achievement.entity';

@Injectable()
export class PrismaAchievementRepository implements IAchievementRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Achievement[]> {
    const achievements = await this.prisma.achievement.findMany({
      orderBy: { category: 'asc' },
    });
    return achievements.map((a) => this.achievementToDomain(a));
  }

  async findByKey(key: string): Promise<Achievement | null> {
    const achievement = await this.prisma.achievement.findUnique({
      where: { key },
    });
    return achievement ? this.achievementToDomain(achievement) : null;
  }

  async findById(id: string): Promise<Achievement | null> {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id },
    });
    return achievement ? this.achievementToDomain(achievement) : null;
  }

  async findUserAchievements(userId: string): Promise<UserAchievement[]> {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { user_id: userId },
      orderBy: { achieved_at: 'desc' },
    });
    return userAchievements.map((ua) => this.userAchievementToDomain(ua));
  }

  async findUserAchievementsWithDetails(
    userId: string,
  ): Promise<{ achievement: Achievement; achieved_at: Date }[]> {
    const userAchievements = await this.prisma.userAchievement.findMany({
      where: { user_id: userId },
      include: { achievement: true },
      orderBy: { achieved_at: 'desc' },
    });

    return userAchievements.map((ua) => ({
      achievement: this.achievementToDomain(ua.achievement),
      achieved_at: ua.achieved_at,
    }));
  }

  async userHasAchievement(
    userId: string,
    achievementKey: string,
  ): Promise<boolean> {
    const count = await this.prisma.userAchievement.count({
      where: {
        user_id: userId,
        achievement: { key: achievementKey },
      },
    });
    return count > 0;
  }

  async awardAchievement(
    userId: string,
    achievementId: string,
  ): Promise<UserAchievement> {
    const userAchievement = await this.prisma.userAchievement.create({
      data: {
        user_id: userId,
        achievement_id: achievementId,
      },
    });
    return this.userAchievementToDomain(userAchievement);
  }

  async countUserAchievements(userId: string): Promise<number> {
    return this.prisma.userAchievement.count({
      where: { user_id: userId },
    });
  }

  async countUserTransactions(userId: string): Promise<number> {
    return this.prisma.transaction.count({
      where: { paid_by_id: userId },
    });
  }

  private achievementToDomain(achievement: any): Achievement {
    return new Achievement({
      id: achievement.id,
      key: achievement.key,
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      xp_reward: achievement.xp_reward,
      category: achievement.category as AchievementCategory,
      created_at: achievement.created_at,
    });
  }

  private userAchievementToDomain(userAchievement: any): UserAchievement {
    return new UserAchievement({
      id: userAchievement.id,
      user_id: userAchievement.user_id,
      achievement_id: userAchievement.achievement_id,
      achieved_at: userAchievement.achieved_at,
    });
  }
}
