import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ICoupleInviteRepository } from '@core/domain/repositories/couple-invite.repository';
import { CoupleInvite, CoupleInviteStatus } from '@core/domain/entities/couple-invite.entity';
import { PrismaCoupleInviteMapper } from '../mappers/prisma-couple-invite.mapper';

@Injectable()
export class PrismaCoupleInviteRepository implements ICoupleInviteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<CoupleInvite | null> {
    const invite = await this.prisma.coupleInvite.findUnique({
      where: { id },
    });

    return invite ? PrismaCoupleInviteMapper.toDomain(invite) : null;
  }

  async findByToken(token: string): Promise<CoupleInvite | null> {
    const invite = await this.prisma.coupleInvite.findUnique({
      where: { token },
    });

    return invite ? PrismaCoupleInviteMapper.toDomain(invite) : null;
  }

  async findByInviterIdAndPending(inviterId: string): Promise<CoupleInvite[]> {
    const invites = await this.prisma.coupleInvite.findMany({
      where: {
        inviter_id: inviterId,
        status: CoupleInviteStatus.PENDING,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return invites.map(PrismaCoupleInviteMapper.toDomain);
  }

  async findByInviteeEmail(email: string): Promise<CoupleInvite[]> {
    const invites = await this.prisma.coupleInvite.findMany({
      where: {
        invitee_email: email,
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return invites.map(PrismaCoupleInviteMapper.toDomain);
  }

  async create(invite: CoupleInvite): Promise<CoupleInvite> {
    const created = await this.prisma.coupleInvite.create({
      data: PrismaCoupleInviteMapper.toPrisma(invite),
    });

    return PrismaCoupleInviteMapper.toDomain(created);
  }

  async save(invite: CoupleInvite): Promise<CoupleInvite> {
    const saved = await this.prisma.coupleInvite.update({
      where: { id: invite.id },
      data: PrismaCoupleInviteMapper.toPrisma(invite),
    });

    return PrismaCoupleInviteMapper.toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.coupleInvite.delete({
      where: { id },
    });
  }

  async existsPendingInviteForInviter(inviterId: string): Promise<boolean> {
    const count = await this.prisma.coupleInvite.count({
      where: {
        inviter_id: inviterId,
        status: CoupleInviteStatus.PENDING,
      },
    });

    return count > 0;
  }

  async existsPendingInviteForEmail(email: string): Promise<boolean> {
    const count = await this.prisma.coupleInvite.count({
      where: {
        invitee_email: email,
        status: CoupleInviteStatus.PENDING,
      },
    });

    return count > 0;
  }
}
