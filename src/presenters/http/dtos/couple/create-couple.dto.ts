import { IsUUID, IsNumber, IsInt, Min, Max, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCoupleDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'First user ID',
  })
  @IsUUID()
  user_id_a: string;

  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174001',
    description: 'Second user ID',
  })
  @IsUUID()
  user_id_b: string;

  @ApiProperty({
    example: 500.00,
    description: 'Monthly free spending allowance for user A',
  })
  @IsNumber()
  @Min(0)
  free_spending_a_monthly: number;

  @ApiProperty({
    example: 500.00,
    description: 'Monthly free spending allowance for user B',
  })
  @IsNumber()
  @Min(0)
  free_spending_b_monthly: number;

  @ApiProperty({
    example: 1,
    description: 'Day of month to reset free spending (1-28)',
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(28)
  reset_day?: number;
}
