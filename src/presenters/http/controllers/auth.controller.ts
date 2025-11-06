import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SignUpUseCase } from '@application/auth/useCases/sign-up/sign-up.use-case';
import { SignInUseCase } from '@application/auth/useCases/sign-in/sign-in.use-case';
import { RefreshTokenUseCase } from '@application/auth/useCases/refresh-token/refresh-token.use-case';
import { SignUpDto } from '../dtos/auth/sign-up.dto';
import { SignInDto } from '../dtos/auth/sign-in.dto';
import { Public } from '@infra/http/auth/decorators/public.decorator';
import { JwtAuthGuard } from '@infra/http/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@infra/http/auth/decorators/current-user.decorator';
import { AuthenticatedUser } from '@shared/types/authenticated-user.type';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly signUpUseCase: SignUpUseCase,
    private readonly signInUseCase: SignInUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
  ) {}

  @Public()
  @Post('sign-up')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or user already exists',
  })
  async signUp(@Body() dto: SignUpDto) {
    return this.signUpUseCase.execute({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    });
  }

  @Public()
  @Post('sign-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Authenticate user and get access token' })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async signIn(@Body() dto: SignInDto) {
    return this.signInUseCase.execute({
      email: dto.email,
      password: dto.password,
    });
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh access token with updated user information' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed successfully with updated information (e.g., after couple linking)',
  })
  async refreshToken(@CurrentUser() user: AuthenticatedUser) {
    return this.refreshTokenUseCase.execute({
      userId: user.id,
    });
  }
}
