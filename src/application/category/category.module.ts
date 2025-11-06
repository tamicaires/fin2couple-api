import { Module } from '@nestjs/common';
import { DatabaseModule } from '@infra/database/database.module';
import { LoggingModule } from '@infra/logging/logging.module';

// Use Cases
import { CreateCategoryUseCase } from './useCases/create-category/create-category.use-case';
import { ListCategoriesUseCase } from './useCases/list-categories/list-categories.use-case';
import { UpdateCategoryUseCase } from './useCases/update-category/update-category.use-case';
import { DeleteCategoryUseCase } from './useCases/delete-category/delete-category.use-case';

// Repositories
import { PrismaCategoryRepository } from '@infra/database/prisma/repositories/prisma-category.repository';

@Module({
  imports: [DatabaseModule, LoggingModule],
  providers: [
    // Use Cases
    CreateCategoryUseCase,
    ListCategoriesUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,

    // Repositories
    {
      provide: 'ICategoryRepository',
      useClass: PrismaCategoryRepository,
    },
  ],
  exports: [
    CreateCategoryUseCase,
    ListCategoriesUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
  ],
})
export class CategoryModule {}
