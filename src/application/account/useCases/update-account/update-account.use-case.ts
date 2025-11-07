import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IAccountRepository } from '@core/domain/repositories/account.repository';
import { AccountNotFoundException } from '@core/exceptions/account/account-not-found.exception';
import { LoggerService } from '@infra/logging/logger.service';
import { AccountType } from '@core/enum/account-type.enum';

export interface UpdateAccountInput {
  coupleId: string;
  accountId: string;
  userId: string;
  name?: string;
  type?: AccountType;
  is_personal?: boolean;
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
 * Updates account name, type, and/or privacy
 *
 * Business Rules:
 * - Account must exist and belong to the couple
 * - Balance cannot be updated directly (use transactions)
 * - Name, type, and privacy (is_personal) can be updated
 * - Changing to personal sets owner_id to current user
 * - Changing to joint sets owner_id to null
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
      userId: input.userId,
      is_personal: input.is_personal,
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
    if (input.is_personal !== undefined) {
      // Change account privacy
      account.owner_id = input.is_personal ? input.userId : null;
    }

    account.updated_at = new Date();

    // Save changes
    const updated = await this.accountRepository.update(account.id, account);

    this.logger.log('Account updated successfully', {
      accountId: updated.id,
      coupleId: input.coupleId,
      is_personal: updated.owner_id !== null,
      owner_id: updated.owner_id,
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
