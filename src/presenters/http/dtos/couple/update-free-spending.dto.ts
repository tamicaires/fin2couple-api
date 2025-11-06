import { IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateFreeSpendingDto {
  @ApiProperty({
    example: 600.00,
    description: 'New monthly free spending amount',
  })
  @IsNumber()
  @Min(0)
  new_monthly_amount: number;
}
