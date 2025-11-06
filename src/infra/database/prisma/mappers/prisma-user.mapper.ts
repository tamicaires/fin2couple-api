import { User as PrismaUser } from '@prisma/client';
import { User, UserRole } from '@core/domain/entities/user.entity';

/**
 * Prisma User Mapper
 *
 * Converts between Prisma model and Domain entity
 * Maintains separation between infrastructure and domain layers
 */
export class PrismaUserMapper {
  static toDomain(prismaUser: PrismaUser): User {
    return new User({
      id: prismaUser.id,
      email: prismaUser.email,
      password_hash: prismaUser.password_hash,
      name: prismaUser.name,
      role: prismaUser.role as UserRole,
      created_at: prismaUser.created_at,
      updated_at: prismaUser.updated_at,
    });
  }

  static toPrisma(user: User): Omit<PrismaUser, 'created_at' | 'updated_at'> {
    return {
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      name: user.name,
      role: user.role,
    };
  }
}
