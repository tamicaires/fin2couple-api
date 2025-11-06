import { randomUUID } from 'crypto';
import { z } from 'zod';

export class UserGameProfile {
  id: string;
  user_id: string;
  current_xp: number;
  total_xp: number;
  level: number;
  current_streak: number;
  longest_streak: number;
  last_activity_at: Date;
  created_at: Date;
  updated_at: Date;

  constructor(data: UserGameProfileType) {
    const validatedData = userGameProfileSchema.parse(data);
    Object.assign(this, validatedData);
    this.id = validatedData.id ?? randomUUID();
    this.created_at = validatedData.created_at ?? new Date();
    this.updated_at = validatedData.updated_at ?? new Date();
  }

  /**
   * Calcula o nível baseado no XP total
   * Fórmula: Level = floor(sqrt(total_xp / 100))
   * Progressão: 0, 100, 400, 900, 1600, 2500...
   */
  static calculateLevel(totalXp: number): number {
    return Math.floor(Math.sqrt(totalXp / 100)) + 1;
  }

  /**
   * Calcula XP necessário para o próximo nível
   */
  getXpForNextLevel(): number {
    const nextLevel = this.level + 1;
    return Math.pow(nextLevel - 1, 2) * 100;
  }

  /**
   * Calcula XP necessário para o nível atual
   */
  getXpForCurrentLevel(): number {
    const currentLevel = this.level;
    return Math.pow(currentLevel - 1, 2) * 100;
  }

  /**
   * Retorna progresso percentual para o próximo nível
   */
  getProgressToNextLevel(): number {
    const currentLevelXp = this.getXpForCurrentLevel();
    const nextLevelXp = this.getXpForNextLevel();
    const xpInCurrentLevel = this.total_xp - currentLevelXp;
    const xpNeededForLevel = nextLevelXp - currentLevelXp;

    return Math.min((xpInCurrentLevel / xpNeededForLevel) * 100, 100);
  }

  /**
   * Adiciona XP e recalcula o nível
   */
  addXp(amount: number): { leveledUp: boolean; newLevel: number } {
    const oldLevel = this.level;

    this.current_xp += amount;
    this.total_xp += amount;
    this.level = UserGameProfile.calculateLevel(this.total_xp);
    this.updated_at = new Date();

    const leveledUp = this.level > oldLevel;

    return {
      leveledUp,
      newLevel: this.level,
    };
  }

  /**
   * Atualiza streak (dias consecutivos)
   */
  updateStreak(): { streakIncreased: boolean; newStreak: number } {
    const now = new Date();
    const lastActivity = new Date(this.last_activity_at);
    const hoursSinceLastActivity = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60);

    // Se passou menos de 24h, não faz nada
    if (hoursSinceLastActivity < 24) {
      return { streakIncreased: false, newStreak: this.current_streak };
    }

    // Se passou mais de 48h, quebra o streak
    if (hoursSinceLastActivity >= 48) {
      this.current_streak = 1;
      this.last_activity_at = now;
      this.updated_at = now;
      return { streakIncreased: true, newStreak: 1 };
    }

    // Se passou entre 24h e 48h, aumenta o streak
    this.current_streak += 1;
    if (this.current_streak > this.longest_streak) {
      this.longest_streak = this.current_streak;
    }
    this.last_activity_at = now;
    this.updated_at = now;

    return { streakIncreased: true, newStreak: this.current_streak };
  }

  /**
   * Retorna o nome do nível baseado no level number
   */
  getLevelName(): string {
    if (this.level === 1) return 'Casal Iniciante';
    if (this.level === 2) return 'Casal Organizado';
    if (this.level === 3) return 'Casal Poupador';
    if (this.level === 4) return 'Casal Investidor';
    if (this.level === 5) return 'Casal Estrategista';
    if (this.level >= 6) return 'Casal Milionário';
    return 'Casal Iniciante';
  }
}

export const userGameProfileSchema = z.object({
  id: z.string().uuid().optional(),
  user_id: z.string().uuid(),
  current_xp: z.number().int().min(0).default(0),
  total_xp: z.number().int().min(0).default(0),
  level: z.number().int().min(1).default(1),
  current_streak: z.number().int().min(0).default(0),
  longest_streak: z.number().int().min(0).default(0),
  last_activity_at: z.date().default(() => new Date()),
  created_at: z.date().optional(),
  updated_at: z.date().optional(),
});

export type UserGameProfileType = z.infer<typeof userGameProfileSchema>;
