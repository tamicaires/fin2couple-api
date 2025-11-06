import { Inject, Injectable } from '@nestjs/common';
import { IUserGameProfileRepository } from '@core/domain/repositories/user-game-profile.repository';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { IUserRepository } from '@core/domain/repositories/user.repository';

interface GetCoupleRankingInput {
  userId: string;
  coupleId: string;
}

interface UserRankingProfile {
  userId: string;
  userName: string;
  level: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  levelName: string;
}

interface GetCoupleRankingOutput {
  currentUser: UserRankingProfile & { isWinner: boolean };
  partner: UserRankingProfile & { isWinner: boolean };
  winner: 'current' | 'partner' | 'tie';
  comparison: {
    xpDifference: number;
    levelDifference: number;
    streakDifference: number;
  };
}

@Injectable()
export class GetCoupleRankingUseCase {
  constructor(
    @Inject('IUserGameProfileRepository')
    private readonly userGameProfileRepository: IUserGameProfileRepository,
    @Inject('ICoupleRepository')
    private readonly coupleRepository: ICoupleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetCoupleRankingInput): Promise<GetCoupleRankingOutput> {
    // Get couple to find partner
    const couple = await this.coupleRepository.findById(input.coupleId);
    if (!couple) {
      throw new Error('Couple not found');
    }

    const partnerId = couple.getPartnerId(input.userId);
    if (!partnerId) {
      throw new Error('Partner not found');
    }

    // Get both users
    const [currentUser, partner] = await Promise.all([
      this.userRepository.findById(input.userId),
      this.userRepository.findById(partnerId),
    ]);

    if (!currentUser || !partner) {
      throw new Error('User not found');
    }

    // Get both game profiles
    const [currentProfile, partnerProfile] = await Promise.all([
      this.userGameProfileRepository.findOrCreate(input.userId),
      this.userGameProfileRepository.findOrCreate(partnerId),
    ]);

    // Calculate scores (weighted: 70% XP, 20% streak, 10% level)
    const currentScore =
      currentProfile.total_xp * 0.7 +
      currentProfile.current_streak * 20 +
      currentProfile.level * 100;

    const partnerScore =
      partnerProfile.total_xp * 0.7 +
      partnerProfile.current_streak * 20 +
      partnerProfile.level * 100;

    const winner =
      currentScore > partnerScore
        ? 'current'
        : partnerScore > currentScore
          ? 'partner'
          : 'tie';

    const currentUserData: UserRankingProfile = {
      userId: currentUser.id,
      userName: currentUser.name,
      level: currentProfile.level,
      totalXp: currentProfile.total_xp,
      currentStreak: currentProfile.current_streak,
      longestStreak: currentProfile.longest_streak,
      levelName: currentProfile.getLevelName(),
    };

    const partnerData: UserRankingProfile = {
      userId: partner.id,
      userName: partner.name,
      level: partnerProfile.level,
      totalXp: partnerProfile.total_xp,
      currentStreak: partnerProfile.current_streak,
      longestStreak: partnerProfile.longest_streak,
      levelName: partnerProfile.getLevelName(),
    };

    return {
      currentUser: {
        ...currentUserData,
        isWinner: winner === 'current',
      },
      partner: {
        ...partnerData,
        isWinner: winner === 'partner',
      },
      winner,
      comparison: {
        xpDifference: currentProfile.total_xp - partnerProfile.total_xp,
        levelDifference: currentProfile.level - partnerProfile.level,
        streakDifference:
          currentProfile.current_streak - partnerProfile.current_streak,
      },
    };
  }
}
