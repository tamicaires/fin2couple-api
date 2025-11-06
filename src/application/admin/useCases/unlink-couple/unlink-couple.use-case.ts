import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { CoupleNotFoundException } from '@core/exceptions/couple/couple-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';

export interface UnlinkCoupleInput {
  couple_id: string;
  reason?: string;
}

export interface UnlinkCoupleOutput {
  success: boolean;
  message: string;
}

/**
 * Unlink Couple Use Case
 *
 * Admin only: Remove a couple link (all related data will be cascade deleted)
 */
@Injectable()
export class UnlinkCoupleUseCase
  implements IUseCase<UnlinkCoupleInput, UnlinkCoupleOutput>
{
  constructor(
    @Inject('ICoupleRepository')
    private readonly coupleRepository: ICoupleRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: UnlinkCoupleInput): Promise<UnlinkCoupleOutput> {
    this.logger.logUseCase('UnlinkCoupleUseCase', {
      couple_id: input.couple_id,
      reason: input.reason,
    });

    // Find couple
    const couple = await this.coupleRepository.findById(input.couple_id);
    if (!couple) {
      throw new CoupleNotFoundException(input.couple_id);
    }

    // Delete couple (cascade will delete all related data)
    await this.coupleRepository.delete(couple.id);

    this.logger.log(
      `Admin unlinked couple: ${input.couple_id} (Reason: ${input.reason || 'Not specified'})`,
    );

    return {
      success: true,
      message: 'Couple unlinked successfully. All related data has been deleted.',
    };
  }
}
