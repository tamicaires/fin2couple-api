import { Injectable, Inject } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IAchievementRepository } from '@core/domain/repositories/achievement.repository';
import { IUserGameProfileRepository } from '@core/domain/repositories/user-game-profile.repository';
import { LoggerService } from '@infra/logging/logger.service';

export interface CheckAchievementsInput {
  userId: string;
}

export interface CheckAchievementsOutput {
  newAchievements: Array<{
    key: string;
    name: string;
    xp_reward: number;
  }>;
}

@Injectable()
export class CheckAchievementsUseCase
  implements IUseCase<CheckAchievementsInput, CheckAchievementsOutput>
{
  constructor(
    @Inject('IAchievementRepository')
    private readonly achievementRepository: IAchievementRepository,
    @Inject('IUserGameProfileRepository')
    private readonly gameProfileRepository: IUserGameProfileRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    input: CheckAchievementsInput,
  ): Promise<CheckAchievementsOutput> {
    this.logger.logUseCase('CheckAchievementsUseCase', { userId: input.userId });

    const newAchievements: Array<{
      key: string;
      name: string;
      xp_reward: number;
    }> = [];

    const transactionCount =
      await this.achievementRepository.countUserTransactions(input.userId);
    const profile = await this.gameProfileRepository.findByUserId(input.userId);

    if (!profile) {
      this.logger.warn('No game profile found', {
        userId: input.userId,
      });
      return { newAchievements };
    }

    await this.checkTransactionAchievements(
      input.userId,
      transactionCount,
      newAchievements,
    );
    await this.checkStreakAchievements(
      input.userId,
      profile.current_streak,
      newAchievements,
    );
    await this.checkLevelAchievements(
      input.userId,
      profile.level,
      newAchievements,
    );

    return { newAchievements };
  }

  private async checkTransactionAchievements(
    userId: string,
    count: number,
    newAchievements: Array<{ key: string; name: string; xp_reward: number }>,
  ) {
    const checks = [
      { count: 1, key: 'FIRST_TRANSACTION' },
      { count: 10, key: 'TX_10' },
      { count: 50, key: 'TX_50' },
      { count: 100, key: 'TX_100' },
    ];

    for (const check of checks) {
      if (count >= check.count) {
        await this.awardIfNew(userId, check.key, newAchievements);
      }
    }
  }

  private async checkStreakAchievements(
    userId: string,
    streak: number,
    newAchievements: Array<{ key: string; name: string; xp_reward: number }>,
  ) {
    const checks = [
      { streak: 3, key: 'STREAK_3' },
      { streak: 7, key: 'STREAK_7' },
      { streak: 14, key: 'STREAK_14' },
      { streak: 30, key: 'STREAK_30' },
      { streak: 100, key: 'STREAK_100' },
    ];

    for (const check of checks) {
      if (streak >= check.streak) {
        await this.awardIfNew(userId, check.key, newAchievements);
      }
    }
  }

  private async checkLevelAchievements(
    userId: string,
    level: number,
    newAchievements: Array<{ key: string; name: string; xp_reward: number }>,
  ) {
    const checks = [
      { level: 5, key: 'LEVEL_5' },
      { level: 10, key: 'LEVEL_10' },
      { level: 20, key: 'LEVEL_20' },
      { level: 50, key: 'LEVEL_50' },
    ];

    for (const check of checks) {
      if (level >= check.level) {
        await this.awardIfNew(userId, check.key, newAchievements);
      }
    }
  }

  private async awardIfNew(
    userId: string,
    achievementKey: string,
    newAchievements: Array<{ key: string; name: string; xp_reward: number }>,
  ) {
    const hasAchievement = await this.achievementRepository.userHasAchievement(
      userId,
      achievementKey,
    );

    if (!hasAchievement) {
      const achievement =
        await this.achievementRepository.findByKey(achievementKey);

      if (achievement) {
        await this.achievementRepository.awardAchievement(
          userId,
          achievement.id,
        );

        newAchievements.push({
          key: achievement.key,
          name: achievement.name,
          xp_reward: achievement.xp_reward,
        });

        this.eventEmitter.emit('achievement.unlocked', {
          userId,
          achievementKey: achievement.key,
          xpReward: achievement.xp_reward,
        });

        this.logger.log('Achievement unlocked', {
          userId,
          achievementKey: achievement.key,
          xpReward: achievement.xp_reward,
        });
      }
    }
  }
}
