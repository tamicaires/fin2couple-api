import { IsString, IsOptional, IsIn, Matches, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Alimentação',
    description: 'Category name',
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  name: string;

  @ApiProperty({
    example: 'ShoppingCart',
    description: 'Lucide icon name',
    default: 'Circle',
  })
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiProperty({
    example: '#f59e0b',
    description: 'Hex color code',
    default: '#6b7280',
  })
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid hex color code (e.g., #f59e0b)',
  })
  @IsOptional()
  color?: string;

  @ApiProperty({
    example: 'EXPENSE',
    description: 'Transaction type this category applies to (null = both types)',
    enum: ['INCOME', 'EXPENSE', null],
    required: false,
  })
  @IsOptional()
  @IsIn(['INCOME', 'EXPENSE', null])
  type?: 'INCOME' | 'EXPENSE' | null;
}
