import { IsString, IsEnum, IsNumber, IsOptional, MinLength, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@core/enum/account-type.enum';

export class CreateAccountDto {
  @ApiProperty({
    example: 'Checking Account',
    description: 'Account name',
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    example: AccountType.CHECKING,
    enum: AccountType,
    description: 'Account type',
  })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty({
    example: 1000.00,
    description: 'Initial account balance',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  initial_balance?: number;
}
