import { CoupleInvite } from '../entities/couple-invite.entity';

/**
 * Couple Invite Repository Interface (Contract)
 *
 * Defines the contract for Couple Invite data access.
 * Implementation in infra/database/prisma/repositories
 */
export interface ICoupleInviteRepository {
  findById(id: string): Promise<CoupleInvite | null>;
  findByToken(token: string): Promise<CoupleInvite | null>;
  findByInviterIdAndPending(inviterId: string): Promise<CoupleInvite[]>;
  findByInviteeEmail(email: string): Promise<CoupleInvite[]>;
  create(invite: CoupleInvite): Promise<CoupleInvite>;
  save(invite: CoupleInvite): Promise<CoupleInvite>;
  delete(id: string): Promise<void>;

  // Business queries
  existsPendingInviteForInviter(inviterId: string): Promise<boolean>;
  existsPendingInviteForEmail(email: string): Promise<boolean>;
}
