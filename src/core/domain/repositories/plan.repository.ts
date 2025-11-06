import { Plan } from '../entities/plan.entity';

/**
 * Plan Repository Interface (Contract)
 *
 * Manages subscription plans and their limits
 */
export interface IPlanRepository {
  findById(id: string): Promise<Plan | null>;
  findByName(name: string): Promise<Plan | null>;
  findAll(): Promise<Plan[]>;
  findActive(): Promise<Plan[]>;
  create(plan: Plan): Promise<Plan>;
  update(id: string, data: Partial<Plan>): Promise<Plan>;
  delete(id: string): Promise<void>;

  // Business queries
  findFreePlan(): Promise<Plan | null>;
  findByPriceRange(minPrice: number, maxPrice: number): Promise<Plan[]>;
}
