import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TransactionRegisteredEvent } from '../domain-events/transaction-registered.event';
import { BudgetAchievedEvent } from '../domain-events/budget-achieved.event';
import { AwardXPUseCase } from '@application/user-game-profile/use-cases/award-xp.use-case';
import { UpdateStreakUseCase } from '@application/user-game-profile/use-cases/update-streak.use-case';
import { LoggerService } from '@infra/logging/logger.service';

@Injectable()
export class GamificationListener {
  constructor(
    private readonly awardXPUseCase: AwardXPUseCase,
    private readonly updateStreakUseCase: UpdateStreakUseCase,
    private readonly logger: LoggerService,
  ) {}

  @OnEvent('transaction.registered')
  async handleTransactionRegistered(event: TransactionRegisteredEvent) {
    try {
      this.logger.log('Transaction registered, awarding XP and updating streak', {
        userId: event.userId,
        transactionId: event.transactionId,
      });

      await this.updateStreakUseCase.execute({
        userId: event.userId,
      });

      await this.awardXPUseCase.execute({
        userId: event.userId,
        amount: 10,
        reason: 'Transação registrada',
      });

      this.logger.log('XP awarded and streak updated successfully');
    } catch (error) {
      this.logger.error(
        'Failed to award XP or update streak',
        error instanceof Error ? error.stack : String(error),
        { userId: event.userId },
      );
    }
  }

  @OnEvent('budget.achieved')
  async handleBudgetAchieved(event: BudgetAchievedEvent) {
    try {
      this.logger.log('Budget achieved, awarding bonus XP', {
        userId: event.userId,
      });

      await this.awardXPUseCase.execute({
        userId: event.userId,
        amount: 50,
        reason: 'Ficou dentro do orçamento mensal',
      });

      this.logger.log('Bonus XP awarded successfully');
    } catch (error) {
      this.logger.error(
        'Failed to award bonus XP',
        error instanceof Error ? error.stack : String(error),
        { userId: event.userId },
      );
    }
  }

  @OnEvent('streak.milestone')
  async handleStreakMilestone(event: { userId: string; days: number }) {
    try {
      this.logger.log('Streak milestone reached', event);

      const xpReward = event.days === 7 ? 200 : event.days === 30 ? 500 : 100;

      await this.awardXPUseCase.execute({
        userId: event.userId,
        amount: xpReward,
        reason: `Sequência de ${event.days} dias mantida!`,
      });

      this.logger.log('Streak XP awarded successfully');
    } catch (error) {
      this.logger.error(
        'Failed to award streak XP',
        error instanceof Error ? error.stack : String(error),
        { userId: event.userId },
      );
    }
  }
}
