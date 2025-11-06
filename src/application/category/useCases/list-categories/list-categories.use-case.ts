import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { ICategoryRepository } from '@core/domain/repositories/category.repository';
import { LoggerService } from '@infra/logging/logger.service';

export interface ListCategoriesInput {
  coupleId: string;
  type?: 'INCOME' | 'EXPENSE' | null;
}

export interface CategoryOutput {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'INCOME' | 'EXPENSE' | null;
  is_default: boolean;
  created_at: Date;
}

export interface ListCategoriesOutput {
  categories: CategoryOutput[];
}

@Injectable()
export class ListCategoriesUseCase
  implements IUseCase<ListCategoriesInput, ListCategoriesOutput>
{
  constructor(
    @Inject('ICategoryRepository')
    private readonly categoryRepository: ICategoryRepository,
    private readonly logger: LoggerService,
  ) {}

  async execute(input: ListCategoriesInput): Promise<ListCategoriesOutput> {
    this.logger.logUseCase('ListCategoriesUseCase', {
      coupleId: input.coupleId,
      type: input.type,
    });

    const categories = input.type !== undefined
      ? await this.categoryRepository.findByCoupleAndType(input.coupleId, input.type)
      : await this.categoryRepository.findAll(input.coupleId);

    return {
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: cat.color,
        type: cat.type,
        is_default: cat.is_default,
        created_at: cat.created_at,
      })),
    };
  }
}
