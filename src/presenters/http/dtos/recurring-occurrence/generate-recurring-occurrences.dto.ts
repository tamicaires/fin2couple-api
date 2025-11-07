import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsInt, Min, Max } from 'class-validator';

export class GenerateRecurringOccurrencesDto {
  @ApiProperty({
    description: 'Template ID to generate occurrences for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  template_id: string;

  @ApiProperty({
    description: 'How many months ahead to generate occurrences (default: 3)',
    example: 3,
    required: false,
    minimum: 1,
    maximum: 12,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  months_ahead?: number;
}
