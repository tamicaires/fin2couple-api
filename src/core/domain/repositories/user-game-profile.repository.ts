import { UserGameProfile } from '../entities/user-game-profile.entity';

export interface IUserGameProfileRepository {
  /**
   * Busca perfil de gamificação por ID do usuário
   */
  findByUserId(userId: string): Promise<UserGameProfile | null>;

  /**
   * Cria um novo perfil de gamificação
   */
  create(profile: UserGameProfile): Promise<UserGameProfile>;

  /**
   * Atualiza perfil de gamificação
   */
  update(userId: string, data: Partial<UserGameProfile>): Promise<UserGameProfile>;

  /**
   * Busca ou cria perfil (útil para garantir que sempre existe)
   */
  findOrCreate(userId: string): Promise<UserGameProfile>;
}
