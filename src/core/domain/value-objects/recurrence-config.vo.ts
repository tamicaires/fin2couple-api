import { RecurrenceFrequency } from '@core/enum/recurrence-frequency.enum';
import { addDays, addWeeks, addMonths, addYears, isBefore, isAfter } from 'date-fns';

/**
 * Value Object representing recurrence configuration
 */
export class RecurrenceConfig {
  private constructor(
    public readonly frequency: RecurrenceFrequency,
    public readonly interval: number,
    public readonly startDate: Date,
    public readonly endDate: Date | null,
  ) {
    this.validate();
  }

  /**
   * Create a new RecurrenceConfig
   */
  static create(
    frequency: RecurrenceFrequency,
    interval: number,
    startDate: Date,
    endDate: Date | null = null,
  ): RecurrenceConfig {
    return new RecurrenceConfig(frequency, interval, startDate, endDate);
  }

  /**
   * Calculate the next occurrence date from a given date
   */
  calculateNextOccurrence(fromDate: Date): Date {
    switch (this.frequency) {
      case RecurrenceFrequency.DAILY:
        return addDays(fromDate, this.interval);
      case RecurrenceFrequency.WEEKLY:
        return addWeeks(fromDate, this.interval);
      case RecurrenceFrequency.MONTHLY:
        return addMonths(fromDate, this.interval);
      case RecurrenceFrequency.YEARLY:
        return addYears(fromDate, this.interval);
      default:
        throw new Error(`Unsupported frequency: ${this.frequency}`);
    }
  }

  /**
   * Check if a given date is within the recurrence period
   */
  isWithinPeriod(date: Date): boolean {
    if (isBefore(date, this.startDate)) {
      return false;
    }

    if (this.endDate && isAfter(date, this.endDate)) {
      return false;
    }

    return true;
  }

  /**
   * Check if the recurrence has ended
   */
  hasEnded(currentDate: Date = new Date()): boolean {
    if (!this.endDate) {
      return false;
    }
    return isAfter(currentDate, this.endDate);
  }

  /**
   * Check if recurrence is infinite (no end date)
   */
  isInfinite(): boolean {
    return this.endDate === null;
  }

  /**
   * Get human-readable frequency label in Portuguese
   */
  getFrequencyLabel(): string {
    switch (this.frequency) {
      case RecurrenceFrequency.DAILY:
        if (this.interval === 1) return 'Diário';
        return `A cada ${this.interval} dias`;
      case RecurrenceFrequency.WEEKLY:
        if (this.interval === 1) return 'Semanal';
        return `A cada ${this.interval} semanas`;
      case RecurrenceFrequency.MONTHLY:
        if (this.interval === 1) return 'Mensal';
        return `A cada ${this.interval} meses`;
      case RecurrenceFrequency.YEARLY:
        if (this.interval === 1) return 'Anual';
        return `A cada ${this.interval} anos`;
      default:
        return 'Desconhecido';
    }
  }

  /**
   * Create a copy with updated end date
   */
  withEndDate(endDate: Date | null): RecurrenceConfig {
    return new RecurrenceConfig(this.frequency, this.interval, this.startDate, endDate);
  }

  /**
   * Create a copy with updated interval
   */
  withInterval(interval: number): RecurrenceConfig {
    return new RecurrenceConfig(this.frequency, interval, this.startDate, this.endDate);
  }

  private validate(): void {
    if (this.interval < 1) {
      throw new Error('Interval must be at least 1');
    }

    if (this.endDate && isBefore(this.endDate, this.startDate)) {
      throw new Error('End date must be after start date');
    }

    if (!Object.values(RecurrenceFrequency).includes(this.frequency)) {
      throw new Error(`Invalid frequency: ${this.frequency}`);
    }
  }

  equals(other: RecurrenceConfig): boolean {
    return (
      this.frequency === other.frequency &&
      this.interval === other.interval &&
      this.startDate.getTime() === other.startDate.getTime() &&
      (this.endDate?.getTime() ?? null) === (other.endDate?.getTime() ?? null)
    );
  }
}
