import { TransactionType } from '@core/enum/transaction-type.enum';

export class TransactionRegisteredEvent {
  constructor(
    public readonly transactionId: string,
    public readonly coupleId: string,
    public readonly userId: string,
    public readonly type: TransactionType,
    public readonly amount: number,
    public readonly is_free_spending: boolean,
  ) {}
}
