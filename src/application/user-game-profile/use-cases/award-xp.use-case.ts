import { Inject, Injectable } from '@nestjs/common';
import { IUserGameProfileRepository } from '@core/domain/repositories/user-game-profile.repository';
import { LoggerService } from '@infra/logging/logger.service';

interface AwardXPInput {
  userId: string;
  amount: number;
  reason: string; // Para logging e tracking
}

interface AwardXPOutput {
  currentXp: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  newLevel?: number;
  levelName: string;
}

@Injectable()
export class AwardXPUseCase {
  constructor(
    @Inject('IUserGameProfileRepository')
    private readonly userGameProfileRepository: IUserGameProfileRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: AwardXPInput): Promise<AwardXPOutput> {
    // Busca ou cria perfil
    const profile = await this.userGameProfileRepository.findOrCreate(input.userId);

    // Adiciona XP usando método da entidade
    const result = profile.addXp(input.amount);

    // Salva no banco
    await this.userGameProfileRepository.update(input.userId, {
      current_xp: profile.current_xp,
      total_xp: profile.total_xp,
      level: profile.level,
      updated_at: profile.updated_at,
    });

    // Log para tracking
    this.logger.log(
      `[AwardXP] User ${input.userId} gained ${input.amount} XP. Reason: ${input.reason}. ` +
        `Total XP: ${profile.total_xp}, Level: ${profile.level}${result.leveledUp ? ' (LEVEL UP!)' : ''}`,
    );

    return {
      currentXp: profile.current_xp,
      totalXp: profile.total_xp,
      level: profile.level,
      leveledUp: result.leveledUp,
      newLevel: result.leveledUp ? result.newLevel : undefined,
      levelName: profile.getLevelName(),
    };
  }
}
