import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { IInstallmentTemplateRepository } from '@core/domain/repositories/installment-template.repository';
import { IInstallmentRepository } from '@core/domain/repositories/installment.repository';
import { PayInstallmentUseCase } from '@application/installment/useCases/pay-installment/pay-installment.use-case';
import { JwtAuthGuard } from '@infra/http/auth/guards/jwt-auth.guard';
import { CoupleGuard } from '@infra/http/auth/guards/couple.guard';
import { CoupleId } from '@infra/http/auth/decorators/couple-id.decorator';
import { PayInstallmentDto } from '../dtos/installment/pay-installment.dto';

@ApiTags('Installments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CoupleGuard)
@Controller('installments')
export class InstallmentController {
  constructor(
    @Inject('IInstallmentTemplateRepository')
    private readonly templateRepository: IInstallmentTemplateRepository,
    @Inject('IInstallmentRepository')
    private readonly installmentRepository: IInstallmentRepository,
    private readonly payInstallmentUseCase: PayInstallmentUseCase,
  ) {}

  // Template routes
  @Get('templates')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all installment templates for the couple' })
  @ApiResponse({
    status: 200,
    description: 'Templates retrieved successfully',
  })
  async listTemplates(@CoupleId() coupleId: string) {
    return this.templateRepository.findByCoupleId(coupleId);
  }

  @Get('templates/active')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List active installment templates' })
  @ApiResponse({
    status: 200,
    description: 'Active templates retrieved successfully',
  })
  async listActiveTemplates(@CoupleId() coupleId: string) {
    return this.templateRepository.findActiveByCoupleId(coupleId);
  }

  @Get('templates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific installment template' })
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

  @Post('templates/:id/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Deactivate an installment template' })
  @ApiParam({
    name: 'id',
    description: 'Template ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Template deactivated successfully',
  })
  async deactivateTemplate(@Param('id') templateId: string) {
    await this.templateRepository.deactivate(templateId);
    return { message: 'Template deactivated successfully' };
  }

  @Post('templates/:id/activate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Activate an installment template' })
  @ApiParam({
    name: 'id',
    description: 'Template ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Template activated successfully',
  })
  async activateTemplate(@Param('id') templateId: string) {
    await this.templateRepository.activate(templateId);
    return { message: 'Template activated successfully' };
  }

  @Delete('templates/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete an installment template' })
  @ApiParam({
    name: 'id',
    description: 'Template ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Template deleted successfully',
  })
  async deleteTemplate(@Param('id') templateId: string) {
    await this.templateRepository.delete(templateId);
    return { message: 'Template deleted successfully' };
  }

  // Installment routes
  @Get('template/:templateId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all installments for a template' })
  @ApiParam({
    name: 'templateId',
    description: 'Template ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Installments retrieved successfully',
  })
  async listByTemplate(@Param('templateId') templateId: string) {
    return this.installmentRepository.findByTemplateId(templateId);
  }

  @Get('template/:templateId/pending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List pending installments for a template' })
  @ApiParam({
    name: 'templateId',
    description: 'Template ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending installments retrieved successfully',
  })
  async listPendingByTemplate(@Param('templateId') templateId: string) {
    return this.installmentRepository.findPendingByTemplateId(templateId);
  }

  @Get('due')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List due installments within date range' })
  @ApiResponse({
    status: 200,
    description: 'Due installments retrieved successfully',
  })
  async listDueInstallments(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.installmentRepository.findDueInstallments(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('overdue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List overdue pending installments' })
  @ApiResponse({
    status: 200,
    description: 'Overdue installments retrieved successfully',
  })
  async listOverdueInstallments() {
    return this.installmentRepository.findOverdueInstallments();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific installment' })
  @ApiParam({
    name: 'id',
    description: 'Installment ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Installment retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Installment not found',
  })
  async getInstallment(@Param('id') installmentId: string) {
    return this.installmentRepository.findById(installmentId);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pay an installment (creates transaction)' })
  @ApiParam({
    name: 'id',
    description: 'Installment ID',
    type: 'string',
  })
  @ApiBody({ type: PayInstallmentDto })
  @ApiResponse({
    status: 200,
    description: 'Installment paid successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot pay installment',
  })
  @ApiResponse({
    status: 404,
    description: 'Installment not found',
  })
  async payInstallment(
    @Param('id') installmentId: string,
    @Body() dto: PayInstallmentDto,
  ) {
    return this.payInstallmentUseCase.execute({
      installment_id: installmentId,
      transaction_date: dto.transaction_date,
    });
  }

  @Post(':id/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip an installment' })
  @ApiParam({
    name: 'id',
    description: 'Installment ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Installment skipped successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot skip installment',
  })
  @ApiResponse({
    status: 404,
    description: 'Installment not found',
  })
  async skipInstallment(@Param('id') installmentId: string) {
    await this.installmentRepository.markAsSkipped(installmentId);
    return { message: 'Installment skipped successfully' };
  }
}
