import { randomUUID } from 'crypto';
import { z } from 'zod';

export enum CoupleInviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
}

export class CoupleInvite {
  id: string;
  inviter_id: string;
  invitee_name: string;
  invitee_email: string;
  token: string;
  status: CoupleInviteStatus;
  couple_id: string | null;
  expires_at: Date;
  created_at: Date;
  accepted_at: Date | null;

  constructor(data: CoupleInviteType) {
    const validatedData = coupleInviteSchema.parse(data);
    Object.assign(this, validatedData);
    this.id = validatedData.id ?? randomUUID();
    this.token = validatedData.token ?? this.generateToken();
    this.status = validatedData.status ?? CoupleInviteStatus.PENDING;
    this.couple_id = validatedData.couple_id ?? null;
    this.expires_at = validatedData.expires_at ?? this.getDefaultExpirationDate();
    this.created_at = validatedData.created_at ?? new Date();
    this.accepted_at = validatedData.accepted_at ?? null;
  }

  private generateToken(): string {
    // Generate a secure random token
    return randomUUID() + randomUUID().replace(/-/g, '');
  }

  private getDefaultExpirationDate(): Date {
    // Token expires in 7 days
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);
    return expirationDate;
  }

  // Helper: Check if invite is expired
  isExpired(): boolean {
    return new Date() > this.expires_at || this.status === CoupleInviteStatus.EXPIRED;
  }

  // Helper: Check if invite is pending
  isPending(): boolean {
    return this.status === CoupleInviteStatus.PENDING && !this.isExpired();
  }

  // Helper: Check if invite can be accepted
  canBeAccepted(): boolean {
    return this.isPending();
  }

  // Helper: Accept invite
  accept(coupleId: string): void {
    if (!this.canBeAccepted()) {
      throw new Error('Invite cannot be accepted');
    }
    this.status = CoupleInviteStatus.ACCEPTED;
    this.couple_id = coupleId;
    this.accepted_at = new Date();
  }

  // Helper: Cancel invite
  cancel(): void {
    if (this.status === CoupleInviteStatus.ACCEPTED) {
      throw new Error('Cannot cancel an accepted invite');
    }
    this.status = CoupleInviteStatus.CANCELED;
  }

  // Helper: Mark as expired
  markAsExpired(): void {
    if (this.status === CoupleInviteStatus.PENDING) {
      this.status = CoupleInviteStatus.EXPIRED;
    }
  }

  // Helper: Get invite link
  getInviteLink(baseUrl: string): string {
    return `${baseUrl}/aceitar-convite/${this.token}`;
  }
}

export const coupleInviteSchema = z.object({
  id: z.string().uuid().optional(),
  inviter_id: z.string().uuid(),
  invitee_name: z.string().min(1),
  invitee_email: z.string().email(),
  token: z.string().optional(),
  status: z.nativeEnum(CoupleInviteStatus).optional(),
  couple_id: z.string().uuid().nullable().optional(),
  expires_at: z.date().optional(),
  created_at: z.date().optional(),
  accepted_at: z.date().nullable().optional(),
});

export type CoupleInviteType = z.infer<typeof coupleInviteSchema>;
