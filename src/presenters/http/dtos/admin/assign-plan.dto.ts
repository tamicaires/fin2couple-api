import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsInt, Min, IsIn } from 'class-validator';

export class AssignPlanDto {
  @ApiProperty({
    description: 'Couple ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  couple_id: string;

  @ApiProperty({
    description: 'Plan name',
    example: 'UNLIMITED',
    enum: ['FREE', 'PREMIUM', 'UNLIMITED'],
  })
  @IsString()
  @IsIn(['FREE', 'PREMIUM', 'UNLIMITED'])
  plan_name: string;

  @ApiProperty({
    description: 'Duration in days (null = unlimited)',
    example: 365,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  duration_days?: number;

  @ApiProperty({
    description: 'Reason for assignment (audit trail)',
    example: 'Early adopter bonus',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
