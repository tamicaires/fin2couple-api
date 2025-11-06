import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICategoryRepository } from '@core/domain/repositories/category.repository';
import { LoggerService } from '@infra/logging/logger.service';

export interface UpdateCategoryInput {
  categoryId: string;
  coupleId: string;
  name?: string;
  icon?: string;
  color?: string;
  type?: 'INCOME' | 'EXPENSE' | null;
}

export interface UpdateCategoryOutput {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE' | null;
  updated_at: Date;
}

@Injectable()
export class UpdateCategoryUseCase
  implements IUseCase<UpdateCategoryInput, UpdateCategoryOutput>
{
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: UpdateCategoryInput): Promise<UpdateCategoryOutput> {
    this.logger.logUseCase('UpdateCategoryUseCase', {
      categoryId: input.categoryId,
      coupleId: input.coupleId,
    });

    const category = await this.categoryRepository.findById(input.categoryId);

    if (!category || category.couple_id !== input.coupleId) {
      throw new NotFoundException(`Category with ID ${input.categoryId} not found`);
    }

    // Update fields if provided
    if (input.name !== undefined) category.name = input.name;
    if (input.icon !== undefined) category.icon = input.icon;
    if (input.color !== undefined) category.color = input.color;
    if (input.type !== undefined) category.type = input.type;

    category.updated_at = new Date();

    const updated = await this.categoryRepository.update(category);

    this.logger.log('Category updated successfully', {
      categoryId: updated.id,
    });

    return {
      id: updated.id,
      name: updated.name,
      icon: updated.icon,
      color: updated.color,
      type: updated.type,
      updated_at: updated.updated_at,
    };
  }
}
