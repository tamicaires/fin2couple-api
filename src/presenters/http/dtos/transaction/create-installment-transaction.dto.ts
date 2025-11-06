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

export class CreateInstallmentTransactionDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Account ID where transaction will be registered',
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
    example: 1200.0,
    description: 'Total amount to be divided into installments',
  })
  @IsNumber()
  @Min(0.01)
  total_amount: number;

  @ApiProperty({
    example: 12,
    description: 'Number of installments (minimum 2)',
  })
  @IsInt()
  @Min(2)
  total_installments: number;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Category ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiProperty({
    example: 'Smart TV 55" Samsung',
    description: 'Description of the purchase',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: '2025-01-15T10:00:00Z',
    description: 'Date of the first installment',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  first_installment_date?: Date;

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
