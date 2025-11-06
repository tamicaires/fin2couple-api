import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@infra/http/auth/guards/jwt-auth.guard';
import { AdminGuard } from '@infra/http/auth/guards/admin.guard';

// Use Cases
import { ListAllUsersUseCase } from '@application/admin/useCases/list-all-users/list-all-users.use-case';
import { UpdateUserEmailUseCase } from '@application/admin/useCases/update-user-email/update-user-email.use-case';
import { LinkCoupleUseCase } from '@application/admin/useCases/link-couple/link-couple.use-case';
import { UnlinkCoupleUseCase } from '@application/admin/useCases/unlink-couple/unlink-couple.use-case';
import { RegisterUserByAdminUseCase } from '@application/admin/useCases/register-user/register-user.use-case';
import { AssignPlanToCoupleUseCase } from '@application/admin/useCases/assign-plan-to-couple/assign-plan-to-couple.use-case';

// DTOs
import { AssignPlanDto } from '../dtos/admin/assign-plan.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly listAllUsersUseCase: ListAllUsersUseCase,
    private readonly updateUserEmailUseCase: UpdateUserEmailUseCase,
    private readonly linkCoupleUseCase: LinkCoupleUseCase,
    private readonly unlinkCoupleUseCase: UnlinkCoupleUseCase,
    private readonly registerUserByAdminUseCase: RegisterUserByAdminUseCase,
    private readonly assignPlanToCoupleUseCase: AssignPlanToCoupleUseCase,
  ) {}

  @Get('users')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] List all users with pagination' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.listAllUsersUseCase.execute({
      page: page ? parseInt(page) : undefined,
      limit: limit ? parseInt(limit) : undefined,
      search,
    });
  }

  @Post('users')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[ADMIN] Register a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async registerUser(
    @Body() body: { name: string; email: string; password: string; reason?: string },
  ) {
    return this.registerUserByAdminUseCase.execute({
      name: body.name,
      email: body.email,
      password: body.password,
      reason: body.reason,
    });
  }

  @Patch('users/:userId/email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Update user email' })
  @ApiResponse({ status: 200, description: 'Email updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  async updateUserEmail(
    @Param('userId') userId: string,
    @Body() body: { newEmail: string; reason?: string },
  ) {
    return this.updateUserEmailUseCase.execute({
      userId,
      newEmail: body.newEmail,
      reason: body.reason,
    });
  }

  @Post('couples/link')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '[ADMIN] Link two users as a couple' })
  @ApiResponse({ status: 201, description: 'Couple linked successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 409, description: 'User already in a couple' })
  async linkCouple(
    @Body() body: { user_id_a: string; user_id_b: string; reason?: string },
  ) {
    return this.linkCoupleUseCase.execute({
      user_id_a: body.user_id_a,
      user_id_b: body.user_id_b,
      reason: body.reason,
    });
  }

  @Delete('couples/:coupleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Unlink a couple' })
  @ApiResponse({ status: 200, description: 'Couple unlinked successfully' })
  @ApiResponse({ status: 404, description: 'Couple not found' })
  async unlinkCouple(
    @Param('coupleId') coupleId: string,
    @Body() body?: { reason?: string },
  ) {
    return this.unlinkCoupleUseCase.execute({
      couple_id: coupleId,
      reason: body?.reason,
    });
  }

  @Post('couples/assign-plan')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '[ADMIN] Assign a plan to a couple' })
  @ApiResponse({ status: 200, description: 'Plan assigned successfully' })
  @ApiResponse({ status: 404, description: 'Couple or Plan not found' })
  async assignPlanToCouple(@Body() body: AssignPlanDto) {
    return this.assignPlanToCoupleUseCase.execute({
      coupleId: body.couple_id,
      planName: body.plan_name,
      durationDays: body.duration_days,
      reason: body.reason,
    });
  }
}
