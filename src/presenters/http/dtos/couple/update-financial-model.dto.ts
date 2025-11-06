import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { FinancialModel } from '@prisma/client';

export class UpdateFinancialModelDto {
  @ApiProperty({
    description: 'Financial model for the couple',
    enum: ['TRANSPARENT', 'AUTONOMOUS', 'CUSTOM'],
    example: 'AUTONOMOUS',
  })
  @IsEnum(['TRANSPARENT', 'AUTONOMOUS', 'CUSTOM'])
  financial_model: FinancialModel;

  @ApiProperty({
    description: 'Optional reason for changing the financial model',
    required: false,
    example: 'Decidimos ter mais autonomia financeira',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
