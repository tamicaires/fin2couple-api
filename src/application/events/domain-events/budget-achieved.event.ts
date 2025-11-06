export class BudgetAchievedEvent {
  constructor(
    public readonly userId: string,
    public readonly coupleId: string,
    public readonly monthlyBudget: number,
    public readonly actualSpent: number,
  ) {}
}
