/**
 * Defines the scope of updates for recurring or installment transactions
 */
export enum TransactionUpdateScope {
  /**
   * Update only the current transaction/occurrence
   */
  THIS_ONLY = 'THIS_ONLY',

  /**
   * Update the current and all future transactions
   * For installments: updates current and remaining installments
   * For recurring: updates template and future occurrences
   */
  THIS_AND_FUTURE = 'THIS_AND_FUTURE',

  /**
   * Update all related transactions
   * For installments: updates all installments in the group
   * For recurring: updates template and all generated transactions
   */
  ALL = 'ALL',
}
