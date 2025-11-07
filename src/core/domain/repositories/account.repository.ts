import { Account } from '../entities/account.entity';

/**
 * Account Repository Interface (Contract)
 *
 * IMPORTANT: All queries MUST filter by couple_id (enforced by PrismaTenantService)
 */
export interface IAccountRepository {
  findById(id: string): Promise<Account | null>;
  findByCoupleId(coupleId: string): Promise<Account[]>;
  findByOwnerId(ownerId: string): Promise<Account[]>;
  findJointAccounts(coupleId: string): Promise<Account[]>;
  findVisibleAccounts(coupleId: string, userId: string): Promise<Account[]>;
  create(account: Account): Promise<Account>;
  update(id: string, data: Partial<Account>): Promise<Account>;
  delete(id: string): Promise<void>;

  // Business queries
  countByCoupleId(coupleId: string): Promise<number>;
  getTotalBalance(coupleId: string): Promise<number>;

  // Balance operations
  updateBalance(id: string, newBalance: number): Promise<void>;
}
