import { IsString, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { AccountType } from '@core/enum/account-type.enum';

export class UpdateAccountDto {
  @ApiProperty({
    example: 'Savings Account',
    description: 'New account name',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({
    example: AccountType.SAVINGS,
    enum: AccountType,
    description: 'New account type',
    required: false,
  })
  @IsOptional()
  @IsEnum(AccountType)
  type?: AccountType;

  @ApiProperty({
    example: true,
    description: 'Change account privacy: true = personal (private), false = joint (shared)',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_personal?: boolean;
}
