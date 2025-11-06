import { TransactionType } from '@core/enum/transaction-type.enum';

export class TransactionDeletedEvent {
  constructor(
    public readonly transactionId: string,
    public readonly coupleId: string,
    public readonly userId: string,
    public readonly type: TransactionType,
    public readonly amount: number,
  ) {}
}
