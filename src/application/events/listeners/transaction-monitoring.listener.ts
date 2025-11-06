import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { LoggerService } from '@infra/logging/logger.service';
import { TransactionRegisteredEvent } from '../transaction-registered.event';
import { TransactionDeletedEvent } from '../transaction-deleted.event';
import { TransactionType } from '@core/enum/transaction-type.enum';

/**
 * Transaction Monitoring Listener
 *
 * Listens to transaction events for monitoring and analytics
 *
 * Features:
 * - Logs high-value transactions
 * - Tracks free spending usage
 * - Monitors spending patterns
 */
@Injectable()
export class TransactionMonitoringListener {
  private readonly HIGH_VALUE_THRESHOLD = 1000;

  constructor(private readonly logger: LoggerService) {}

  @OnEvent('transaction.registered')
  handleTransactionRegistered(event: TransactionRegisteredEvent): void {
    // Log high-value transactions
    if (event.amount >= this.HIGH_VALUE_THRESHOLD) {
      this.logger.log('High-value transaction detected', {
        transactionId: event.transactionId,
        coupleId: event.coupleId,
        amount: event.amount,
        type: event.type,
      });
    }

    // Track free spending usage
    if (event.is_free_spending && event.type === TransactionType.EXPENSE) {
      this.logger.log('Free spending used', {
        transactionId: event.transactionId,
        coupleId: event.coupleId,
        userId: event.userId,
        amount: event.amount,
      });
    }
  }

  @OnEvent('transaction.deleted')
  handleTransactionDeleted(event: TransactionDeletedEvent): void {
    this.logger.log('Transaction deleted', {
      transactionId: event.transactionId,
      coupleId: event.coupleId,
      type: event.type,
      amount: event.amount,
    });
  }
}
