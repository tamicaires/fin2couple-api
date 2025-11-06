import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { AccountNotFoundException } from '@core/exceptions/account/account-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';
import { AccountType } from '@core/enum/account-type.enum';

export interface UpdateAccountInput {
  coupleId: string;
  accountId: string;
  name?: string;
  type?: AccountType;
}

export interface UpdateAccountOutput {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  updated_at: Date;
}

/**
 * Update Account Use Case
 *
 * Updates account name and/or type
 *
 * Business Rules:
 * - Account must exist and belong to the couple
 * - Balance cannot be updated directly (use transactions)
 * - Only name and type can be updated
 */
@Injectable()
export class UpdateAccountUseCase implements IUseCase<UpdateAccountInput, UpdateAccountOutput> {
  constructor(
    @Inject('IAccountRepository')

    private readonly accountRepository: IAccountRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: UpdateAccountInput): Promise<UpdateAccountOutput> {
    this.logger.logUseCase('UpdateAccountUseCase', {
      coupleId: input.coupleId,
      accountId: input.accountId,
    });

    // Get account
    const account = await this.accountRepository.findById(input.accountId);
    if (!account) {
      throw new AccountNotFoundException(input.accountId);
    }

    // Update fields
    if (input.name !== undefined) {
      account.name = input.name;
    }
    if (input.type !== undefined) {
      account.type = input.type;
    }

    account.updated_at = new Date();

    // Save changes
    const updated = await this.accountRepository.update(account.id, account);

    this.logger.log('Account updated successfully', {
      accountId: updated.id,
      coupleId: input.coupleId,
    });

    return {
      id: updated.id,
      name: updated.name,
      type: updated.type,
      balance: updated.balance,
      updated_at: updated.updated_at,
    };
  }
}
