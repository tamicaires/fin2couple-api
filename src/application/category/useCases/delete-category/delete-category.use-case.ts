import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICategoryRepository } from '@core/domain/repositories/category.repository';
import { LoggerService } from '@infra/logging/logger.service';

export interface DeleteCategoryInput {
  categoryId: string;
  coupleId: string;
}

export interface DeleteCategoryOutput {
  success: boolean;
  message: string;
}

@Injectable()
export class DeleteCategoryUseCase
  implements IUseCase<DeleteCategoryInput, DeleteCategoryOutput>
{
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: DeleteCategoryInput): Promise<DeleteCategoryOutput> {
    this.logger.logUseCase('DeleteCategoryUseCase', {
      categoryId: input.categoryId,
      coupleId: input.coupleId,
    });

    const category = await this.categoryRepository.findById(input.categoryId);

    if (!category || category.couple_id !== input.coupleId) {
      throw new NotFoundException(`Category with ID ${input.categoryId} not found`);
    }

    if (!category.canBeDeleted()) {
      throw new BadRequestException('Cannot delete default categories');
    }

    await this.categoryRepository.delete(input.categoryId);

    this.logger.log('Category deleted successfully', {
      categoryId: input.categoryId,
    });

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }
}
