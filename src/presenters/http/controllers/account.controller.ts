import { Controller, Post, Get, Put, Delete, Body, Param, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CreateAccountUseCase } from '@application/account/useCases/create-account/create-account.use-case';
import { ListAccountsUseCase } from '@application/account/useCases/list-accounts/list-accounts.use-case';
import { UpdateAccountUseCase } from '@application/account/useCases/update-account/update-account.use-case';
import { DeleteAccountUseCase } from '@application/account/useCases/delete-account/delete-account.use-case';
import { CreateAccountDto } from '../dtos/account/create-account.dto';
import { UpdateAccountDto } from '../dtos/account/update-account.dto';
import { JwtAuthGuard } from '@infra/http/auth/guards/jwt-auth.guard';
import { CoupleGuard } from '@infra/http/auth/guards/couple.guard';
import { CoupleId } from '@infra/http/auth/decorators/couple-id.decorator';

@ApiTags('Accounts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CoupleGuard)
@Controller('accounts')
export class AccountController {
  constructor(
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly deleteAccountUseCase: DeleteAccountUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({
    status: 201,
    description: 'Account successfully created',
  })
  @ApiResponse({
    status: 403,
    description: 'Account limit reached for current plan',
  })
  async createAccount(
    @CoupleId() coupleId: string,
    @Body() dto: CreateAccountDto,
  ) {
    return this.createAccountUseCase.execute({
      coupleId,
      name: dto.name,
      type: dto.type,
      initial_balance: dto.initial_balance,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all accounts for the couple' })
  @ApiResponse({
    status: 200,
    description: 'Accounts retrieved successfully',
  })
  async listAccounts(@CoupleId() coupleId: string) {
    return this.listAccountsUseCase.execute({ coupleId });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update account details' })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Account updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async updateAccount(
    @CoupleId() coupleId: string,
    @Param('id') accountId: string,
    @Body() dto: UpdateAccountDto,
  ) {
    return this.updateAccountUseCase.execute({
      coupleId,
      accountId,
      name: dto.name,
      type: dto.type,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an account' })
  @ApiParam({
    name: 'id',
    description: 'Account ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete account with non-zero balance',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async deleteAccount(
    @CoupleId() coupleId: string,
    @Param('id') accountId: string,
  ) {
    return this.deleteAccountUseCase.execute({
      coupleId,
      accountId,
    });
  }
}
