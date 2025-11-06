import {
  IsEnum,
  IsNumber,
  IsString,
  IsBoolean,
  IsOptional,
  IsDate,
  IsUUID,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionType } from '@core/enum/transaction-type.enum';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';
import { TransactionUpdateScope } from '@core/enum/transaction-update-scope.enum';

export class UpdateTransactionWithScopeDto {
  @ApiProperty({
    example: TransactionUpdateScope.THIS_ONLY,
    enum: TransactionUpdateScope,
    description: 'Update scope: THIS_ONLY, THIS_AND_FUTURE, or ALL',
  })
  @IsEnum(TransactionUpdateScope)
  update_scope: TransactionUpdateScope;

  @ApiProperty({
    example: TransactionType.EXPENSE,
    enum: TransactionType,
    description: 'Transaction type',
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiProperty({
    example: 150.5,
    description: 'Transaction amount',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiProperty({
    example: 'Updated description',
    description: 'Transaction description',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Account ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  account_id?: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Category ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  category_id?: string;

  @ApiProperty({
    example: true,
    description: 'Whether this is a couple expense',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_couple_expense?: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether this should be deducted from free spending',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_free_spending?: boolean;

  @ApiProperty({
    example: TransactionVisibility.SHARED,
    enum: TransactionVisibility,
    description: 'Transaction visibility',
    required: false,
  })
  @IsOptional()
  @IsEnum(TransactionVisibility)
  visibility?: TransactionVisibility;

  @ApiProperty({
    example: '2025-01-15T10:00:00Z',
    description: 'Transaction date',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  transaction_date?: Date;
}
