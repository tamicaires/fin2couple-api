import { Category } from '../entities/category.entity';

export interface ICategoryRepository {
  create(category: Category): Promise<Category>;
  findById(id: string): Promise<Category | null>;
  findAll(coupleId: string): Promise<Category[]>;
  findByCoupleAndType(coupleId: string, type: 'INCOME' | 'EXPENSE' | null): Promise<Category[]>;
  update(category: Category): Promise<Category>;
  delete(id: string): Promise<void>;
}
