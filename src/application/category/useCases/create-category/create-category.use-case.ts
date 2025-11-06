import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICategoryRepository } from '@core/domain/repositories/category.repository';
import { Category } from '@core/domain/entities/category.entity';
import { LoggerService } from '@infra/logging/logger.service';

export interface CreateCategoryInput {
  coupleId: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE' | null;
}

export interface CreateCategoryOutput {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE' | null;
  is_default: boolean;
  created_at: Date;
}

@Injectable()
export class CreateCategoryUseCase
  implements IUseCase<CreateCategoryInput, CreateCategoryOutput>
{
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: CreateCategoryInput): Promise<CreateCategoryOutput> {
    this.logger.logUseCase('CreateCategoryUseCase', {
      coupleId: input.coupleId,
      name: input.name,
    });

    const category = new Category({
      couple_id: input.coupleId,
      name: input.name,
      icon: input.icon,
      color: input.color,
      type: input.type,
      is_default: false,
    });

    const created = await this.categoryRepository.create(category);

    this.logger.log('Category created successfully', {
      categoryId: created.id,
      name: created.name,
    });

    return {
      id: created.id,
      name: created.name,
      icon: created.icon,
      color: created.color,
      type: created.type,
      is_default: created.is_default,
      created_at: created.created_at,
    };
  }
}
