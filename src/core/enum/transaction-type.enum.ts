export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  ADJUSTMENT = 'ADJUSTMENT', // System adjustments (e.g., initial balance correction)
}

// User-facing transaction types (excludes ADJUSTMENT which is system-only)
export type UserTransactionType = Exclude<TransactionType, TransactionType.ADJUSTMENT>;

// Category-compatible transaction types (INCOME or EXPENSE only, excludes ADJUSTMENT)
export type CategoryTransactionType = TransactionType.INCOME | TransactionType.EXPENSE;
