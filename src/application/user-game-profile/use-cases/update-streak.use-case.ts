import { Inject, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IUserGameProfileRepository } from '@core/domain/repositories/user-game-profile.repository';
import { LoggerService } from '@infra/logging/logger.service';

interface UpdateStreakInput {
  userId: string;
}

interface UpdateStreakOutput {
  currentStreak: number;
  longestStreak: number;
  streakIncreased: boolean;
  milestoneReached?: number;
}

@Injectable()
export class UpdateStreakUseCase {
  constructor(
    @Inject('IUserGameProfileRepository')
    private readonly userGameProfileRepository: IUserGameProfileRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: UpdateStreakInput): Promise<UpdateStreakOutput> {
    const profile = await this.userGameProfileRepository.findOrCreate(
      input.userId,
    );

    const now = new Date();
    const lastActivity = profile.last_activity_at;
    const hoursSinceLastActivity = lastActivity
      ? (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60)
      : 999;

    let streakIncreased = false;
    let milestoneReached: number | undefined;

    if (hoursSinceLastActivity < 24) {
      this.logger.log('User already logged activity today', {
        userId: input.userId,
      });
    } else if (hoursSinceLastActivity < 48) {
      profile.current_streak += 1;
      streakIncreased = true;

      if (profile.current_streak > profile.longest_streak) {
        profile.longest_streak = profile.current_streak;
      }

      const milestones = [3, 7, 14, 30, 100];
      if (milestones.includes(profile.current_streak)) {
        milestoneReached = profile.current_streak;

        this.eventEmitter.emit('streak.milestone', {
          userId: input.userId,
          days: profile.current_streak,
        });
      }

      this.logger.log('Streak increased!', {
        userId: input.userId,
        currentStreak: profile.current_streak,
      });
    } else {
      this.logger.log('Streak broken, resetting to 1', {
        userId: input.userId,
        oldStreak: profile.current_streak,
      });
      profile.current_streak = 1;
    }

    profile.last_activity_at = now;
    profile.updated_at = now;

    await this.userGameProfileRepository.update(input.userId, {
      current_streak: profile.current_streak,
      longest_streak: profile.longest_streak,
      last_activity_at: profile.last_activity_at,
      updated_at: profile.updated_at,
    });

    this.eventEmitter.emit('streak.updated', {
      userId: input.userId,
      currentStreak: profile.current_streak,
    });

    return {
      currentStreak: profile.current_streak,
      longestStreak: profile.longest_streak,
      streakIncreased,
      milestoneReached,
    };
  }
}
