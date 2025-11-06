import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateInviteDto {
  @ApiProperty({
    description: 'Name of the person being invited',
    example: 'Maria Santos',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  invitee_name: string;

  @ApiProperty({
    description: 'Email of the person being invited',
    example: 'maria@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  invitee_email: string;
}
