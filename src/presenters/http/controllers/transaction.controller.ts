import { Controller, Post, Get, Delete, Patch, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { RegisterTransactionUseCase } from '@application/transaction/useCases/register-transaction/register-transaction.use-case';
import { ListTransactionsUseCase } from '@application/transaction/useCases/list-transactions/list-transactions.use-case';
import { DeleteTransactionUseCase } from '@application/transaction/useCases/delete-transaction/delete-transaction.use-case';
import { UpdateFreeSpendingUseCase } from '@application/transaction/useCases/update-free-spending/update-free-spending.use-case';
import { CreateInstallmentTransactionUseCase } from '@application/transaction/useCases/create-installment-transaction/create-installment-transaction.use-case';
import { CreateRecurringTransactionUseCase } from '@application/transaction/useCases/create-recurring-transaction/create-recurring-transaction.use-case';
import { UpdateTransactionUseCase } from '@application/transaction/useCases/update-transaction/update-transaction.use-case';
import { RegisterTransactionDto } from '../dtos/transaction/register-transaction.dto';
import { UpdateFreeSpendingDto } from '../dtos/transaction/update-free-spending.dto';
import { CreateInstallmentTransactionDto } from '../dtos/transaction/create-installment-transaction.dto';
import { CreateRecurringTransactionDto } from '../dtos/transaction/create-recurring-transaction.dto';
import { UpdateTransactionWithScopeDto } from '../dtos/transaction/update-transaction-with-scope.dto';
import { JwtAuthGuard } from '@infra/http/auth/guards/jwt-auth.guard';
import { CoupleGuard } from '@infra/http/auth/guards/couple.guard';
import { CurrentUser } from '@infra/http/auth/decorators/current-user.decorator';
import { CoupleId } from '@infra/http/auth/decorators/couple-id.decorator';
import { UserId } from '@infra/http/auth/decorators/user-id.decorator';
import { AuthenticatedUser } from '@shared/types/authenticated-user.type';
import { TransactionVisibility } from '@core/enum/transaction-visibility.enum';
import { UserTransactionType } from '@core/enum/transaction-type.enum';

@ApiTags('Transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CoupleGuard)
@Controller('transactions')
export class TransactionController {
  constructor(
    private readonly registerTransactionUseCase: RegisterTransactionUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    private readonly deleteTransactionUseCase: DeleteTransactionUseCase,
    private readonly updateFreeSpendingUseCase: UpdateFreeSpendingUseCase,
    private readonly createInstallmentTransactionUseCase: CreateInstallmentTransactionUseCase,
    private readonly createRecurringTransactionUseCase: CreateRecurringTransactionUseCase,
    private readonly updateTransactionUseCase: UpdateTransactionUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new transaction' })
  @ApiResponse({
    status: 201,
    description: 'Transaction registered and balances updated',
  })
  @ApiResponse({
    status: 400,
    description: 'Insufficient free spending or invalid input',
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
  })
  async registerTransaction(
    @CoupleId() coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterTransactionDto,
  ) {
    return this.registerTransactionUseCase.execute({
      coupleId,
      userId: user.id,
      account_id: dto.account_id,
      type: dto.type as UserTransactionType, // ADJUSTMENT not allowed for user transactions
      amount: dto.amount,
      category_id: dto.category_id,
      description: dto.description,
      transaction_date: dto.transaction_date,
      is_free_spending: dto.is_free_spending,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List transactions with pagination and filters' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of results per page (default: 50)',
  })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'Cursor for pagination',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['INCOME', 'EXPENSE'],
    description: 'Filter by transaction type',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by category',
  })
  @ApiQuery({
    name: 'account_id',
    required: false,
    type: String,
    description: 'Filter by account ID',
  })
  @ApiQuery({
    name: 'start_date',
    required: false,
    type: String,
    description: 'Filter by start date (ISO format)',
  })
  @ApiQuery({
    name: 'end_date',
    required: false,
    type: String,
    description: 'Filter by end date (ISO format)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in description',
  })
  @ApiResponse({
    status: 200,
    description: 'Transactions retrieved successfully',
  })
  async listTransactions(
    @CoupleId() coupleId: string,
    @UserId() userId: string,
    @Query('limit') limit?: number,
    @Query('cursor') cursor?: string,
    @Query('type') type?: string,
    @Query('category') category?: string,
    @Query('account_id') accountId?: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
    @Query('search') search?: string,
  ) {
    return this.listTransactionsUseCase.execute({
      coupleId,
      userId,
      limit: limit ? Number(limit) : undefined,
      cursor,
      type,
      category,
      accountId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
    });
  }

  @Patch(':id/free-spending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update transaction free spending flag' })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Free spending flag updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async updateFreeSpending(
    @CoupleId() coupleId: string,
    @Param('id') transactionId: string,
    @Body() dto: UpdateFreeSpendingDto,
  ) {
    return this.updateFreeSpendingUseCase.execute({
      coupleId,
      transactionId,
      is_free_spending: dto.is_free_spending,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a transaction and revert balances' })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction deleted and balances reverted',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async deleteTransaction(
    @CoupleId() coupleId: string,
    @Param('id') transactionId: string,
  ) {
    return this.deleteTransactionUseCase.execute({
      coupleId,
      transactionId,
    });
  }

  @Post('installment')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create installment transactions' })
  @ApiResponse({
    status: 201,
    description: 'Installment transactions created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input (minimum 2 installments required)',
  })
  async createInstallmentTransaction(
    @CoupleId() coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateInstallmentTransactionDto,
  ) {
    return this.createInstallmentTransactionUseCase.execute({
      couple_id: coupleId,
      total_amount: dto.total_amount,
      total_installments: dto.total_installments,
      description: dto.description ?? null,
      paid_by_id: user.id,
      account_id: dto.account_id,
      is_couple_expense: dto.is_couple_expense ?? false,
      is_free_spending: dto.is_free_spending ?? false,
      visibility: dto.visibility ?? TransactionVisibility.SHARED,
      category: dto.category_id ?? null,
      first_installment_date: dto.first_installment_date ?? new Date(),
    });
  }

  @Post('recurring')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create recurring transaction template' })
  @ApiResponse({
    status: 201,
    description: 'Recurring transaction template created successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid recurrence configuration',
  })
  async createRecurringTransaction(
    @CoupleId() coupleId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRecurringTransactionDto,
  ) {
    return this.createRecurringTransactionUseCase.execute({
      couple_id: coupleId,
      type: dto.type,
      amount: dto.amount,
      description: dto.description ?? null,
      paid_by_id: user.id,
      account_id: dto.account_id,
      is_couple_expense: dto.is_couple_expense ?? false,
      is_free_spending: dto.is_free_spending ?? false,
      visibility: dto.visibility ?? TransactionVisibility.SHARED,
      category: dto.category_id ?? null,
      frequency: dto.frequency,
      interval: dto.interval ?? 1,
      start_date: dto.start_date,
      end_date: dto.end_date ?? null,
      create_first_transaction: dto.create_first_transaction ?? true,
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update transaction with scope (for installment/recurring)' })
  @ApiParam({
    name: 'id',
    description: 'Transaction ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction(s) updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Transaction not found',
  })
  async updateTransaction(
    @Param('id') transactionId: string,
    @Body() dto: UpdateTransactionWithScopeDto,
  ) {
    return this.updateTransactionUseCase.execute({
      transaction_id: transactionId,
      update_scope: dto.update_scope,
      update_data: {
        type: dto.type,
        amount: dto.amount,
        description: dto.description ?? null,
        account_id: dto.account_id,
        category: dto.category_id ?? null,
        is_couple_expense: dto.is_couple_expense,
        is_free_spending: dto.is_free_spending,
        visibility: dto.visibility,
        transaction_date: dto.transaction_date,
      },
    });
  }
}
