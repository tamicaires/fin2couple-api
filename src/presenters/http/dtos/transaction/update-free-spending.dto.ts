import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateFreeSpendingDto {
  @ApiProperty({
    description: 'Whether this transaction is a free spending',
    example: true,
  })
  @IsBoolean()
  is_free_spending: boolean;
}
