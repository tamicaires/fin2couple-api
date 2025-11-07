import {
  Controller,
  Get,
  Post,
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
import { IRecurringOccurrenceRepository } from '@core/domain/repositories/recurring-occurrence.repository';
import { GenerateRecurringOccurrencesUseCase } from '@application/recurring-occurrence/useCases/generate-recurring-occurrences/generate-recurring-occurrences.use-case';
import { PayRecurringOccurrenceUseCase } from '@application/recurring-occurrence/useCases/pay-recurring-occurrence/pay-recurring-occurrence.use-case';
import { JwtAuthGuard } from '@infra/http/auth/guards/jwt-auth.guard';
import { CoupleGuard } from '@infra/http/auth/guards/couple.guard';
import { PayRecurringOccurrenceDto } from '../dtos/recurring-occurrence/pay-recurring-occurrence.dto';
import { GenerateRecurringOccurrencesDto } from '../dtos/recurring-occurrence/generate-recurring-occurrences.dto';

@ApiTags('Recurring Occurrences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, CoupleGuard)
@Controller('recurring-occurrences')
export class RecurringOccurrenceController {
  constructor(
    @Inject('IRecurringOccurrenceRepository')
    private readonly occurrenceRepository: IRecurringOccurrenceRepository,
    private readonly generateOccurrencesUseCase: GenerateRecurringOccurrencesUseCase,
    private readonly payOccurrenceUseCase: PayRecurringOccurrenceUseCase,
  ) {}

  @Get('template/:templateId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all occurrences for a template' })
  @ApiParam({
    name: 'templateId',
    description: 'Template ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Occurrences retrieved successfully',
  })
  async listByTemplate(@Param('templateId') templateId: string) {
    return this.occurrenceRepository.findByTemplateId(templateId);
  }

  @Get('template/:templateId/pending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List pending occurrences for a template' })
  @ApiParam({
    name: 'templateId',
    description: 'Template ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Pending occurrences retrieved successfully',
  })
  async listPendingByTemplate(@Param('templateId') templateId: string) {
    return this.occurrenceRepository.findPendingByTemplateId(templateId);
  }

  @Get('due')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List due occurrences within date range' })
  @ApiResponse({
    status: 200,
    description: 'Due occurrences retrieved successfully',
  })
  async listDueOccurrences(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.occurrenceRepository.findDueOccurrences(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('overdue')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List overdue pending occurrences' })
  @ApiResponse({
    status: 200,
    description: 'Overdue occurrences retrieved successfully',
  })
  async listOverdueOccurrences() {
    return this.occurrenceRepository.findOverdueOccurrences();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific occurrence' })
  @ApiParam({
    name: 'id',
    description: 'Occurrence ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Occurrence retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Occurrence not found',
  })
  async getOccurrence(@Param('id') occurrenceId: string) {
    return this.occurrenceRepository.findById(occurrenceId);
  }

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate occurrences for a template' })
  @ApiBody({ type: GenerateRecurringOccurrencesDto })
  @ApiResponse({
    status: 201,
    description: 'Occurrences generated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input',
  })
  async generateOccurrences(@Body() dto: GenerateRecurringOccurrencesDto) {
    return this.generateOccurrencesUseCase.execute({
      template_id: dto.template_id,
      months_ahead: dto.months_ahead,
    });
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pay an occurrence (creates transaction)' })
  @ApiParam({
    name: 'id',
    description: 'Occurrence ID',
    type: 'string',
  })
  @ApiBody({ type: PayRecurringOccurrenceDto })
  @ApiResponse({
    status: 200,
    description: 'Occurrence paid successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot pay occurrence',
  })
  @ApiResponse({
    status: 404,
    description: 'Occurrence not found',
  })
  async payOccurrence(
    @Param('id') occurrenceId: string,
    @Body() dto: PayRecurringOccurrenceDto,
  ) {
    return this.payOccurrenceUseCase.execute({
      occurrence_id: occurrenceId,
      transaction_date: dto.transaction_date,
    });
  }

  @Post(':id/skip')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Skip an occurrence' })
  @ApiParam({
    name: 'id',
    description: 'Occurrence ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Occurrence skipped successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot skip occurrence',
  })
  @ApiResponse({
    status: 404,
    description: 'Occurrence not found',
  })
  async skipOccurrence(@Param('id') occurrenceId: string) {
    await this.occurrenceRepository.markAsSkipped(occurrenceId);
    return { message: 'Occurrence skipped successfully' };
  }
}
