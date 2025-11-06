import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TransactionRegisteredEvent } from '../domain-events/transaction-registered.event';
import { CheckAchievementsUseCase } from '@application/achievement/use-cases/check-achievements.use-case';
import { AwardXPUseCase } from '@application/user-game-profile/use-cases/award-xp.use-case';
import { LoggerService } from '@infra/logging/logger.service';

@Injectable()
export class AchievementListener {
  constructor(
    private readonly checkAchievementsUseCase: CheckAchievementsUseCase,
    private readonly awardXPUseCase: AwardXPUseCase,
    private readonly logger: LoggerService,
  ) {}

  @OnEvent('transaction.registered')
  async handleTransactionRegistered(event: TransactionRegisteredEvent) {
    try {
      this.logger.log('Checking achievements after transaction', {
        userId: event.userId,
      });

      const result = await this.checkAchievementsUseCase.execute({
        userId: event.userId,
      });

      for (const achievement of result.newAchievements) {
        this.logger.log('New achievement unlocked!', achievement);

        if (achievement.xp_reward > 0) {
          await this.awardXPUseCase.execute({
            userId: event.userId,
            amount: achievement.xp_reward,
            reason: `Conquista: ${achievement.name}`,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to check achievements',
        error instanceof Error ? error.stack : String(error),
        { userId: event.userId },
      );
    }
  }

  @OnEvent('xp.awarded')
  async handleXPAwarded(event: { userId: string; newLevel?: number }) {
    if (!event.newLevel) return;

    try {
      this.logger.log('Checking level achievements', {
        userId: event.userId,
        level: event.newLevel,
      });

      const result = await this.checkAchievementsUseCase.execute({
        userId: event.userId,
      });

      for (const achievement of result.newAchievements) {
        this.logger.log('Level achievement unlocked!', achievement);

        if (achievement.xp_reward > 0) {
          await this.awardXPUseCase.execute({
            userId: event.userId,
            amount: achievement.xp_reward,
            reason: `Conquista: ${achievement.name}`,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to check level achievements',
        error instanceof Error ? error.stack : String(error),
        { userId: event.userId },
      );
    }
  }

  @OnEvent('streak.updated')
  async handleStreakUpdated(event: { userId: string; currentStreak: number }) {
    try {
      this.logger.log('Checking streak achievements', {
        userId: event.userId,
        streak: event.currentStreak,
      });

      const result = await this.checkAchievementsUseCase.execute({
        userId: event.userId,
      });

      for (const achievement of result.newAchievements) {
        this.logger.log('Streak achievement unlocked!', achievement);

        if (achievement.xp_reward > 0) {
          await this.awardXPUseCase.execute({
            userId: event.userId,
            amount: achievement.xp_reward,
            reason: `Conquista: ${achievement.name}`,
          });
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to check streak achievements',
        error instanceof Error ? error.stack : String(error),
        { userId: event.userId },
      );
    }
  }
}
