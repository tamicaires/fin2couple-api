import { CoupleInvite as PrismaCoupleInvite } from '@prisma/client';
import { CoupleInvite, CoupleInviteStatus } from '@core/domain/entities/couple-invite.entity';

export class PrismaCoupleInviteMapper {
  static toDomain(prismaInvite: PrismaCoupleInvite): CoupleInvite {
    return new CoupleInvite({
      id: prismaInvite.id,
      inviter_id: prismaInvite.inviter_id,
      invitee_name: prismaInvite.invitee_name,
      invitee_email: prismaInvite.invitee_email,
      token: prismaInvite.token,
      status: prismaInvite.status as CoupleInviteStatus,
      couple_id: prismaInvite.couple_id,
      expires_at: prismaInvite.expires_at,
      created_at: prismaInvite.created_at,
      accepted_at: prismaInvite.accepted_at,
    });
  }

  static toPrisma(invite: CoupleInvite) {
    return {
      id: invite.id,
      inviter_id: invite.inviter_id,
      invitee_name: invite.invitee_name,
      invitee_email: invite.invitee_email,
      token: invite.token,
      status: invite.status,
      couple_id: invite.couple_id,
      expires_at: invite.expires_at,
      created_at: invite.created_at,
      accepted_at: invite.accepted_at,
    };
  }
}
