import { User } from '../entities/user.entity';

/**
 * User Repository Interface (Contract)
 *
 * Defines the contract for User data access.
 * Implementation in infra/database/prisma/repositories
 */
export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findAll(): Promise<User[]>;
  create(user: User): Promise<User>;
  save(user: User): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;

  // Business queries
  existsByEmail(email: string): Promise<boolean>;
}
