import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICoupleRepository } from '@core/domain/repositories/couple.repository';
import { CoupleNotFoundException } from '@core/exceptions/couple/couple-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';

export interface UpdateCoupleSettingsInput {
  coupleId: string;
  reset_day?: number;
}

export interface UpdateCoupleSettingsOutput {
  id: string;
  reset_day: number;
  updated_at: Date;
}

/**
 * Update Couple Settings Use Case
 *
 * Updates couple configuration settings
 */
@Injectable()
export class UpdateCoupleSettingsUseCase
  implements IUseCase<UpdateCoupleSettingsInput, UpdateCoupleSettingsOutput>
{
  constructor(
    @Inject('ICoupleRepository')
    private readonly coupleRepository: ICoupleRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(
    input: UpdateCoupleSettingsInput,
  ): Promise<UpdateCoupleSettingsOutput> {
    this.logger.logUseCase('UpdateCoupleSettingsUseCase', {
      coupleId: input.coupleId,
      reset_day: input.reset_day,
    });

    // Find couple
    const couple = await this.coupleRepository.findById(input.coupleId);
    if (!couple) {
      throw new CoupleNotFoundException(input.coupleId);
    }

    // Update settings
    if (input.reset_day !== undefined) {
      if (input.reset_day < 1 || input.reset_day > 31) {
        throw new Error('Reset day must be between 1 and 31');
      }
      couple.reset_day = input.reset_day;
    }

    // Save
    const updated = await this.coupleRepository.update(couple.id, {
      reset_day: couple.reset_day,
      updated_at: new Date(),
    });

    this.logger.log(`Couple ${input.coupleId} settings updated successfully`);

    return {
      id: updated.id,
      reset_day: updated.reset_day,
      updated_at: updated.updated_at,
    };
  }
}
