import { randomUUID } from 'crypto';

/**
 * Value Object representing installment information
 */
export class InstallmentInfo {
  private constructor(
    public readonly groupId: string,
    public readonly currentNumber: number,
    public readonly totalInstallments: number,
  ) {
    this.validate();
  }

  /**
   * Create a new InstallmentInfo for the first installment
   */
  static createNew(totalInstallments: number): InstallmentInfo {
    if (totalInstallments < 2) {
      throw new Error('Total installments must be at least 2');
    }

    return new InstallmentInfo(randomUUID(), 1, totalInstallments);
  }

  /**
   * Create InstallmentInfo from existing data
   */
  static create(groupId: string, currentNumber: number, totalInstallments: number): InstallmentInfo {
    return new InstallmentInfo(groupId, currentNumber, totalInstallments);
  }

  /**
   * Create the next installment in the sequence
   */
  next(): InstallmentInfo | null {
    if (this.isLast()) {
      return null;
    }
    return new InstallmentInfo(this.groupId, this.currentNumber + 1, this.totalInstallments);
  }

  /**
   * Check if this is the first installment
   */
  isFirst(): boolean {
    return this.currentNumber === 1;
  }

  /**
   * Check if this is the last installment
   */
  isLast(): boolean {
    return this.currentNumber === this.totalInstallments;
  }

  /**
   * Get formatted label (e.g., "3/12")
   */
  getLabel(): string {
    return `${this.currentNumber}/${this.totalInstallments}`;
  }

  /**
   * Get remaining installments count
   */
  getRemainingCount(): number {
    return this.totalInstallments - this.currentNumber;
  }

  /**
   * Get progress percentage
   */
  getProgressPercentage(): number {
    return (this.currentNumber / this.totalInstallments) * 100;
  }

  private validate(): void {
    if (this.currentNumber < 1) {
      throw new Error('Current installment number must be at least 1');
    }

    if (this.totalInstallments < 2) {
      throw new Error('Total installments must be at least 2');
    }

    if (this.currentNumber > this.totalInstallments) {
      throw new Error('Current installment number cannot exceed total installments');
    }

    if (!this.groupId || this.groupId.trim().length === 0) {
      throw new Error('Group ID cannot be empty');
    }
  }

  equals(other: InstallmentInfo): boolean {
    return (
      this.groupId === other.groupId &&
      this.currentNumber === other.currentNumber &&
      this.totalInstallments === other.totalInstallments
    );
  }
}
