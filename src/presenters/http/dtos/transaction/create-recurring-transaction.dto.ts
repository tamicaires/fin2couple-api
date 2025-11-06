import {
  IsUUID,
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  IsDate,
  Min,
  MaxLength,
  IsInt,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionType } from '@core/enum/transaction-type.enum';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';
import { RecurrenceFrequency } from '@core/enum/recurrence-frequency.enum';

export class CreateRecurringTransactionDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Account ID where transactions will be registered',
  })
  @IsUUID()
  account_id: string;

  @ApiProperty({
    example: TransactionType.EXPENSE,
    enum: TransactionType,
    description: 'Transaction type (INCOME or EXPENSE)',
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiProperty({
    example: 150.0,
    description: 'Amount for each recurring transaction',
  })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty({
    example: RecurrenceFrequency.MONTHLY,
    enum: RecurrenceFrequency,
    description: 'Recurrence frequency',
  })
  @IsEnum(RecurrenceFrequency)
  frequency: RecurrenceFrequency;

  @ApiProperty({
    example: 1,
    description: 'Interval between recurrences (e.g., 1 = every month, 2 = every 2 months)',
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  interval?: number;

  @ApiProperty({
    example: '2025-01-01T00:00:00Z',
    description: 'Start date for recurring transactions',
  })
  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @ApiProperty({
    example: '2025-12-31T23:59:59Z',
    description: 'End date for recurring transactions (null = no end)',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  end_date?: Date;

  @ApiProperty({
    example: true,
    description: 'Whether to create the first transaction immediately',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  create_first_transaction?: boolean;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Category ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiProperty({
    example: 'Netflix subscription',
    description: 'Description of the recurring transaction',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: true,
    description: 'Whether this is a couple expense (shared)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_couple_expense?: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether this should be deducted from free spending allowance',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  is_free_spending?: boolean;

  @ApiProperty({
    example: TransactionVisibility.SHARED,
    enum: TransactionVisibility,
    description: 'Transaction visibility',
    default: TransactionVisibility.SHARED,
  })
  @IsOptional()
  @IsEnum(TransactionVisibility)
  visibility?: TransactionVisibility;
}
