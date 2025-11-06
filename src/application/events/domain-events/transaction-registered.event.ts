export class TransactionRegisteredEvent {
  constructor(
    public readonly transactionId: string,
    public readonly userId: string,
    public readonly coupleId: string,
    public readonly amount: number,
    public readonly type: 'INCOME' | 'EXPENSE',
  ) {}
}
