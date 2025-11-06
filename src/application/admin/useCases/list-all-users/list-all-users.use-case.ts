import { Injectable, Inject } from '@nestjs/common';
import { IUseCase } from '@shared/protocols/use-case.interface';
import { IUserRepository } from '@core/domain/repositories/user.repository';
import { LoggerService } from '@infra/logging/logger.service';

export interface ListAllUsersInput {
  page?: number;
  limit?: number;
  search?: string;
}

export interface ListAllUsersOutput {
  users: Array<{
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: Date;
    has_couple: boolean;
    couple_id?: string;
    partner_name?: string;
  }>;
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * List All Users Use Case
 *
 * Admin only: List all users with pagination and search
 */
@Injectable()
export class ListAllUsersUseCase
  implements IUseCase<ListAllUsersInput, ListAllUsersOutput>
{
  constructor(
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
    @Inject('ICoupleRepository')
    private readonly coupleRepository: any, // Will use findAll method
    private readonly logger: LoggerService,
  ) {}

  async execute(input: ListAllUsersInput): Promise<ListAllUsersOutput> {
    const page = input.page || 1;
    const limit = input.limit || 20;
    const skip = (page - 1) * limit;

    this.logger.logUseCase('ListAllUsersUseCase', {
      page,
      limit,
      search: input.search,
    });

    // Get all users (simplified - in production, use proper pagination)
    const allUsers = await this.userRepository.findAll();

    // Filter by search if provided
    let filteredUsers = allUsers;
    if (input.search) {
      const searchLower = input.search.toLowerCase();
      filteredUsers = allUsers.filter(
        (user) =>
          user.email.toLowerCase().includes(searchLower) ||
          user.name.toLowerCase().includes(searchLower),
      );
    }

    // Get all couples to check which users have couples
    const allCouples = await this.coupleRepository.findAll();
    const coupleMap = new Map();

    for (const couple of allCouples) {
      coupleMap.set(couple.user_id_a, {
        couple_id: couple.id,
        partner_id: couple.user_id_b,
      });
      coupleMap.set(couple.user_id_b, {
        couple_id: couple.id,
        partner_id: couple.user_id_a,
      });
    }

    // Paginate
    const paginatedUsers = filteredUsers.slice(skip, skip + limit);

    // Map users with couple info
    const users = paginatedUsers.map((user) => {
      const coupleInfo = coupleMap.get(user.id);
      let partner_name: string | undefined;

      if (coupleInfo) {
        const partner = allUsers.find((u) => u.id === coupleInfo.partner_id);
        partner_name = partner?.name;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        created_at: user.created_at,
        has_couple: !!coupleInfo,
        couple_id: coupleInfo?.couple_id,
        partner_name,
      };
    });

    return {
      users,
      total: filteredUsers.length,
      page,
      limit,
      totalPages: Math.ceil(filteredUsers.length / limit),
    };
  }
}
