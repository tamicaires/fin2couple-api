import { Inject, Injectable } from '@nestjs/common';
import { IUserGameProfileRepository } from '@core/domain/repositories/user-game-profile.repository';
import { UserGameProfile } from '@core/domain/entities/user-game-profile.entity';

interface GetUserGameProfileInput {
  userId: string;
}

interface GetUserGameProfileOutput {
  profile: UserGameProfile;
  xpForNextLevel: number;
  progressPercentage: number;
  levelName: string;
}

@Injectable()
export class GetUserGameProfileUseCase {
  constructor(
    @Inject('IUserGameProfileRepository')
    private readonly userGameProfileRepository: IUserGameProfileRepository,
  ) {}

  async execute(input: GetUserGameProfileInput): Promise<GetUserGameProfileOutput> {
    // FindOrCreate garante que sempre haverá um perfil
    const profile = await this.userGameProfileRepository.findOrCreate(input.userId);

    return {
      profile,
      xpForNextLevel: profile.getXpForNextLevel(),
      progressPercentage: profile.getProgressToNextLevel(),
      levelName: profile.getLevelName(),
    };
  }
}
