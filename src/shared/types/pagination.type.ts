export interface PaginationInput {
  limit: number;
  cursor?: string;
}

export interface PaginationOutput<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
