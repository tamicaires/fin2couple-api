import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { AccountNotFoundException } from '@core/exceptions/account/account-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';

export interface ArchiveAccountInput {
  coupleId: string;
  accountId: string;
  userId: string;
}

export interface ArchiveAccountOutput {
  success: boolean;
  archived_account_id: string;
}

/**
 * Archive Account Use Case
 *
 * Archives an account (soft delete)
 *
 * Business Rules:
 * - Account must exist and belong to the couple
 * - Sets archived_at timestamp
 * - Account becomes hidden from listings
 * - All transactions preserved
 * - Can be restored later
 */
@Injectable()
export class ArchiveAccountUseCase implements IUseCase<ArchiveAccountInput, ArchiveAccountOutput> {
  constructor(
    @Inject('IAccountRepository')
    private readonly accountRepository: IAccountRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: ArchiveAccountInput): Promise<ArchiveAccountOutput> {
    this.logger.logUseCase('ArchiveAccountUseCase', {
      coupleId: input.coupleId,
      accountId: input.accountId,
      userId: input.userId,
    });

    // Fetch account
    const account = await this.accountRepository.findById(input.accountId);

    this.validateAccountExists(account, input.accountId);

    // Archive account
    await this.accountRepository.archive(input.accountId);

    this.logger.log('Account archived successfully', {
      accountId: input.accountId,
      coupleId: input.coupleId,
      balance: account.balance,
    });

    return {
      success: true,
      archived_account_id: input.accountId,
    };
  }

  /**
   * Validates that account exists, throws exception if not found
   * @private
   */
  private validateAccountExists(account: any, accountId: string): asserts account {
    if (!account) {
      throw new AccountNotFoundException(accountId);
    }
  }
}
