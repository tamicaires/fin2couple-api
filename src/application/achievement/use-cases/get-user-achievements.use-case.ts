import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IAchievementRepository } from '@core/domain/repositories/achievement.repository';
import { LoggerService } from '@infra/logging/logger.service';

export interface GetUserAchievementsInput {
  userId: string;
}

export interface GetUserAchievementsOutput {
  total: number;
  unlocked: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
    category: string;
    achieved_at: Date;
  }>;
  locked: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    icon: string;
    xp_reward: number;
    category: string;
  }>;
}

@Injectable()
export class GetUserAchievementsUseCase
  implements IUseCase<GetUserAchievementsInput, GetUserAchievementsOutput>
{
  constructor(
    @Inject('IAchievementRepository')
    private readonly achievementRepository: IAchievementRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    input: GetUserAchievementsInput,
  ): Promise<GetUserAchievementsOutput> {
    this.logger.logUseCase('GetUserAchievementsUseCase', {
      userId: input.userId,
    });

    const [allAchievements, userAchievements] = await Promise.all([
      this.achievementRepository.findAll(),
      this.achievementRepository.findUserAchievementsWithDetails(input.userId),
    ]);

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievement.id, ua.achieved_at]),
    );

    const unlocked = userAchievements.map((ua) => ({
      id: ua.achievement.id,
      key: ua.achievement.key,
      name: ua.achievement.name,
      description: ua.achievement.description,
      icon: ua.achievement.icon,
      xp_reward: ua.achievement.xp_reward,
      category: ua.achievement.category,
      achieved_at: ua.achieved_at,
    }));

    const locked = allAchievements
      .filter((a) => !unlockedMap.has(a.id))
      .map((a) => ({
        id: a.id,
        key: a.key,
        name: a.name,
        description: a.description,
        icon: a.icon,
        xp_reward: a.xp_reward,
        category: a.category,
      }));

    return {
      total: allAchievements.length,
      unlocked,
      locked,
    };
  }
}
