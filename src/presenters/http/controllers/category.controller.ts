import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CoupleGuard } from '@infra/http/auth/guards/couple.guard';
import { CoupleId } from '@infra/http/auth/decorators/couple-id.decorator';
import { CreateCategoryDto } from '../dtos/category/create-category.dto';
import { UpdateCategoryDto } from '../dtos/category/update-category.dto';
import { CreateCategoryUseCase } from '@application/category/useCases/create-category/create-category.use-case';
import { ListCategoriesUseCase } from '@application/category/useCases/list-categories/list-categories.use-case';
import { UpdateCategoryUseCase } from '@application/category/useCases/update-category/update-category.use-case';
import { DeleteCategoryUseCase } from '@application/category/useCases/delete-category/delete-category.use-case';

@ApiTags('Categories')
@Controller('categories')
@UseGuards(CoupleGuard)
export class CategoryController {
  constructor(
    private readonly createCategoryUseCase: CreateCategoryUseCase,
    private readonly listCategoriesUseCase: ListCategoriesUseCase,
    private readonly updateCategoryUseCase: UpdateCategoryUseCase,
    private readonly deleteCategoryUseCase: DeleteCategoryUseCase,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
  })
  async create(
    @CoupleId() coupleId: string,
    @Body() dto: CreateCategoryDto,
  ) {
    return this.createCategoryUseCase.execute({
      coupleId,
      name: dto.name,
      icon: dto.icon || 'Circle',
      color: dto.color || '#6b7280',
      type: dto.type ?? null,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all categories for the couple' })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ['INCOME', 'EXPENSE'],
    description: 'Filter by transaction type',
  })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async list(
    @CoupleId() coupleId: string,
    @Query('type') type?: 'INCOME' | 'EXPENSE',
  ) {
    return this.listCategoriesUseCase.execute({
      coupleId,
      type: type || undefined,
    });
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a category' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async update(
    @CoupleId() coupleId: string,
    @Param('id') categoryId: string,
    @Body() dto: UpdateCategoryDto,
  ) {
    return this.updateCategoryUseCase.execute({
      categoryId,
      coupleId,
      ...dto,
    });
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a category' })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete default categories',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async delete(
    @CoupleId() coupleId: string,
    @Param('id') categoryId: string,
  ) {
    return this.deleteCategoryUseCase.execute({
      categoryId,
      coupleId,
    });
  }
}
