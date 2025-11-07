import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export class PayInstallmentDto {
  @ApiProperty({
    description: 'Custom transaction date (optional, defaults to installment due_date)',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  transaction_date?: Date;
}
