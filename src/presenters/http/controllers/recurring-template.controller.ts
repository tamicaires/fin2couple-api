import { Controller, Get, Delete, Post, Param, UseGuards, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { IRecurringTransactionTemplateRepository } from '@core/domain/repositories/recurring-transaction-template.repository';
import { GenerateRecurringTransactionsUseCase } from '@application/transaction/useCases/generate-recurring-transactions/generate-recurring-transactions.use-case';
import { JwtAuthGuard } from '@infra/http/auth/guards/jwt-auth.guard';
import { CoupleGuard } from '@infra/http/auth/guards/couple.guard';
import { CoupleId } from '@infra/http/auth/decorators/couple-id.decorator';

@ApiTags('Recurring Templates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CoupleGuard)
@Controller('recurring-templates')
export class RecurringTemplateController {
  constructor(
    @Inject('IRecurringTransactionTemplateRepository')
    private readonly templateRepository: IRecurringTransactionTemplateRepository,
    private readonly generateRecurringTransactionsUseCase: GenerateRecurringTransactionsUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all recurring transaction templates for the couple' })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  async listTemplates(@CoupleId() coupleId: string) {
    return this.templateRepository.findByCoupleId(coupleId);
  }

  @Get('active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List active recurring transaction templates' })
  @ApiResponse({
    status: 200,
    description: 'Active templates retrieved successfully',
  })
  async listActiveTemplates(@CoupleId() coupleId: string) {
    return this.templateRepository.findActiveByCoupleId(coupleId);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific recurring transaction template' })
  @ApiParam({
    name: 'id',
    description: 'Template ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Template retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async getTemplate(@Param('id') templateId: string) {
    return this.templateRepository.findById(templateId);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pause a recurring transaction template' })
  @ApiParam({
    name: 'id',
    description: 'Template ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Template paused successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async pauseTemplate(@Param('id') templateId: string) {
    await this.templateRepository.deactivate(templateId);
    return { message: 'Template paused successfully' };
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resume a paused recurring transaction template' })
  @ApiParam({
    name: 'id',
    description: 'Template ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Template resumed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async resumeTemplate(@Param('id') templateId: string) {
    await this.templateRepository.activate(templateId);
    return { message: 'Template resumed successfully' };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a recurring transaction template' })
  @ApiParam({
    name: 'id',
    description: 'Template ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Template deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Template not found',
  })
  async deleteTemplate(@Param('id') templateId: string) {
    await this.templateRepository.delete(templateId);
    return { message: 'Template deleted successfully' };
  }

  @Post('generate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Manually trigger recurring transactions generation (for testing)' })
  @ApiResponse({
    status: 200,
    description: 'Recurring transactions generated successfully',
  })
  async generateRecurringTransactions() {
    return this.generateRecurringTransactionsUseCase.execute();
  }
}
