import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max, IsOptional } from 'class-validator';

export class UpdateCoupleSettingsDto {
  @ApiProperty({
    description: 'Day of month to reset free spending (1-31)',
    example: 1,
    minimum: 1,
    maximum: 31,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(31)
  reset_day?: number;
}
