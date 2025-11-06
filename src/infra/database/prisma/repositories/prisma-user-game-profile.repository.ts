import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { IUserGameProfileRepository } from '@core/domain/repositories/user-game-profile.repository';
import { UserGameProfile } from '@core/domain/entities/user-game-profile.entity';
import { UserGameProfile as PrismaUserGameProfile } from '@prisma/client';

@Injectable()
export class PrismaUserGameProfileRepository implements IUserGameProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserGameProfile | null> {
    const profile = await this.prisma.userGameProfile.findUnique({
      where: { user_id: userId },
    });

    return profile ? this.toDomain(profile) : null;
  }

  async create(profile: UserGameProfile): Promise<UserGameProfile> {
    const created = await this.prisma.userGameProfile.create({
      data: this.toPrisma(profile),
    });

    return this.toDomain(created);
  }

  async update(userId: string, data: Partial<UserGameProfile>): Promise<UserGameProfile> {
    // Only extract updatable fields
    const updateData: any = {};
    if (data.current_xp !== undefined) updateData.current_xp = data.current_xp;
    if (data.total_xp !== undefined) updateData.total_xp = data.total_xp;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.current_streak !== undefined) updateData.current_streak = data.current_streak;
    if (data.longest_streak !== undefined) updateData.longest_streak = data.longest_streak;
    if (data.last_activity_at !== undefined) updateData.last_activity_at = data.last_activity_at;
    if (data.updated_at !== undefined) updateData.updated_at = data.updated_at;

    const updated = await this.prisma.userGameProfile.update({
      where: { user_id: userId },
      data: updateData,
    });

    return this.toDomain(updated);
  }

  async findOrCreate(userId: string): Promise<UserGameProfile> {
    // Usar upsert do Prisma para evitar race conditions
    const profile = await this.prisma.userGameProfile.upsert({
      where: { user_id: userId },
      update: {}, // Não atualiza nada se já existir
      create: {
        user_id: userId,
        current_xp: 0,
        total_xp: 0,
        level: 1,
        current_streak: 0,
        longest_streak: 0,
        last_activity_at: new Date(),
      },
    });

    return this.toDomain(profile);
  }

  private toDomain(prisma: PrismaUserGameProfile): UserGameProfile {
    return new UserGameProfile({
      id: prisma.id,
      user_id: prisma.user_id,
      current_xp: prisma.current_xp,
      total_xp: prisma.total_xp,
      level: prisma.level,
      current_streak: prisma.current_streak,
      longest_streak: prisma.longest_streak,
      last_activity_at: prisma.last_activity_at,
      created_at: prisma.created_at,
      updated_at: prisma.updated_at,
    });
  }

  private toPrisma(domain: UserGameProfile): Omit<PrismaUserGameProfile, 'created_at' | 'updated_at'> {
    return {
      id: domain.id,
      user_id: domain.user_id,
      current_xp: domain.current_xp,
      total_xp: domain.total_xp,
      level: domain.level,
      current_streak: domain.current_streak,
      longest_streak: domain.longest_streak,
      last_activity_at: domain.last_activity_at,
    };
  }
}
