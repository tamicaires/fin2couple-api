import { Controller, Post, Get, Put, Patch, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CreateCoupleUseCase } from '@application/couple/useCases/create-couple/create-couple.use-case';
import { GetCoupleDashboardUseCase } from '@application/couple/useCases/get-couple-dashboard/get-couple-dashboard.use-case';
import { GetCoupleInfoUseCase } from '@application/couple/useCases/get-couple-info/get-couple-info.use-case';
import { UpdateFreeSpendingUseCase } from '@application/couple/useCases/update-free-spending/update-free-spending.use-case';
import { UpdateCoupleSettingsUseCase } from '@application/couple/useCases/update-couple-settings/update-couple-settings.use-case';
import { UpdateFinancialModelUseCase } from '@application/couple/useCases/update-financial-model/update-financial-model.use-case';
import { CreateInviteUseCase } from '@application/couple/useCases/create-invite/create-invite.use-case';
import { AcceptInviteUseCase } from '@application/couple/useCases/accept-invite/accept-invite.use-case';
import { CreateCoupleDto } from '../dtos/couple/create-couple.dto';
import { UpdateFreeSpendingDto } from '../dtos/couple/update-free-spending.dto';
import { UpdateCoupleSettingsDto } from '../dtos/couple/update-couple-settings.dto';
import { UpdateFinancialModelDto } from '../dtos/couple/update-financial-model.dto';
import { CreateInviteDto } from '../dtos/couple/create-invite.dto';
import { AcceptInviteDto } from '../dtos/couple/accept-invite.dto';
import { JwtAuthGuard } from '@infra/http/auth/guards/jwt-auth.guard';
import { CoupleGuard } from '@infra/http/auth/guards/couple.guard';
import { CurrentUser } from '@infra/http/auth/decorators/current-user.decorator';
import { CoupleId } from '@infra/http/auth/decorators/couple-id.decorator';
import { Public } from '@infra/http/auth/decorators/public.decorator';
import { AuthenticatedUser } from '@shared/types/authenticated-user.type';

@ApiTags('Couple')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('couple')
export class CoupleController {
  constructor(
    private readonly createCoupleUseCase: CreateCoupleUseCase,
    private readonly getCoupleDashboardUseCase: GetCoupleDashboardUseCase,
    private readonly getCoupleInfoUseCase: GetCoupleInfoUseCase,
    private readonly updateFreeSpendingUseCase: UpdateFreeSpendingUseCase,
    private readonly updateCoupleSettingsUseCase: UpdateCoupleSettingsUseCase,
    private readonly updateFinancialModelUseCase: UpdateFinancialModelUseCase,
    private readonly createInviteUseCase: CreateInviteUseCase,
    private readonly acceptInviteUseCase: AcceptInviteUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new couple (tenant)' })
  @ApiResponse({
    status: 201,
    description: 'Couple successfully created with FREE plan subscription',
  })
  @ApiResponse({
    status: 400,
    description: 'User already in a couple or invalid input',
  })
  async createCouple(@Body() dto: CreateCoupleDto) {
    return this.createCoupleUseCase.execute(dto);
  }

  @Get('info')
  @UseGuards(CoupleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get couple and partners information' })
  @ApiResponse({
    status: 200,
    description: 'Couple information retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Couple not found',
  })
  async getCoupleInfo(
    @CoupleId() coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getCoupleInfoUseCase.execute({
      coupleId,
      userId: user.id,
    });
  }

  @Get('dashboard')
  @UseGuards(CoupleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get couple financial dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Dashboard data retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Couple not found',
  })
  async getDashboard(
    @CoupleId() coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.getCoupleDashboardUseCase.execute({
      coupleId,
      userId: user.id,
    });
  }

  @Put('free-spending')
  @UseGuards(CoupleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update free spending allowance' })
  @ApiResponse({
    status: 200,
    description: 'Free spending updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Couple not found',
  })
  async updateFreeSpending(
    @CoupleId() coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateFreeSpendingDto,
  ) {
    return this.updateFreeSpendingUseCase.execute({
      coupleId,
      userId: user.id,
      newMonthlyAmount: dto.new_monthly_amount,
    });
  }

  @Patch('settings')
  @UseGuards(CoupleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update couple settings' })
  @ApiResponse({
    status: 200,
    description: 'Couple settings updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Couple not found',
  })
  async updateSettings(
    @CoupleId() coupleId: string,
    @Body() dto: UpdateCoupleSettingsDto,
  ) {
    return this.updateCoupleSettingsUseCase.execute({
      coupleId,
      reset_day: dto.reset_day,
    });
  }

  @Patch('financial-model')
  @UseGuards(CoupleGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update couple financial model' })
  @ApiResponse({
    status: 200,
    description: 'Financial model updated successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'User does not belong to couple',
  })
  @ApiResponse({
    status: 404,
    description: 'Couple not found',
  })
  async updateFinancialModel(
    @CoupleId() coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateFinancialModelDto,
  ) {
    return this.updateFinancialModelUseCase.execute({
      coupleId,
      userId: user.id,
      financial_model: dto.financial_model,
      reason: dto.reason,
    });
  }

  @Post('invite')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a couple invite' })
  @ApiResponse({
    status: 201,
    description: 'Invite created successfully with unique link',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or email already registered',
  })
  @ApiResponse({
    status: 409,
    description: 'User already in a couple or has pending invite',
  })
  async createInvite(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInviteDto,
  ) {
    return this.createInviteUseCase.execute({
      inviter_id: user.id,
      invitee_name: dto.invitee_name,
      invitee_email: dto.invitee_email,
    });
  }

  @Post('accept-invite')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Accept a couple invite' })
  @ApiResponse({
    status: 201,
    description: 'Invite accepted, user created, and couple formed',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid or expired invite',
  })
  @ApiResponse({
    status: 404,
    description: 'Invite not found',
  })
  async acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.acceptInviteUseCase.execute({
      token: dto.token,
      password: dto.password,
    });
  }
}
