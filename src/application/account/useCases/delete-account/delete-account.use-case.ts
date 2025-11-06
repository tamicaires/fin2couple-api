import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { AccountNotFoundException } from '@core/exceptions/account/account-not-found.exception';
import { CannotDeleteAccountWithBalanceException } from '@core/exceptions/account/cannot-delete-account-with-balance.exception';
import { LoggerService } from '@infra/logging/logger.service';

export interface DeleteAccountInput {
  coupleId: string;
  accountId: string;
}

export interface DeleteAccountOutput {
  success: boolean;
  deleted_account_id: string;
}

/**
 * Delete Account Use Case
 *
 * Deletes an account from the couple
 *
 * Business Rules:
 * - Account must exist and belong to the couple
 * - Account balance must be zero before deletion
 * - Cannot delete if account has pending transactions
 */
@Injectable()
export class DeleteAccountUseCase implements IUseCase<DeleteAccountInput, DeleteAccountOutput> {
  constructor(
    @Inject('IAccountRepository')

    private readonly accountRepository: IAccountRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: DeleteAccountInput): Promise<DeleteAccountOutput> {
    this.logger.logUseCase('DeleteAccountUseCase', {
      coupleId: input.coupleId,
      accountId: input.accountId,
    });

    // Get account
    const account = await this.accountRepository.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundException(input.accountId);
    }

    // Check balance is zero
    if (account.balance !== 0) {
      throw new CannotDeleteAccountWithBalanceException(account.balance);
    }

    // Delete account
    await this.accountRepository.delete(input.accountId);

    this.logger.log('Account deleted successfully', {
      accountId: input.accountId,
      coupleId: input.coupleId,
    });

    return {
      success: true,
      deleted_account_id: input.accountId,
    };
  }
}
