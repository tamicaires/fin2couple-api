import { Injectable, Scope } from '@nestjs/common';
import { TenantContextNotSetException } from '@core/exceptions/infrastructure/tenant-context-not-set.exception';

/**
 * CRITICAL SERVICE: Manages tenant (couple) context for multi-tenancy isolation
 * 
 * This service ensures that ALL database queries are scoped to the correct couple,
 * preventing data leakage between tenants.
 * 
 * Scope: REQUEST - Each HTTP request gets its own instance
 */
@Injectable({ scope: Scope.REQUEST })
export class PrismaTenantService {
  private coupleId: string | null = null;
  private userId: string | null = null;

  /**
   * Sets the tenant context for the current request
   * Called by CoupleGuard after authentication
   */
  setTenantContext(coupleId: string, userId: string): void {
    this.coupleId = coupleId;
    this.userId = userId;
  }

  /**
   * Gets the current couple ID
   * Throws exception if context not set (security measure)
   */
  getCoupleId(): string {
    if (!this.coupleId) {
      throw new TenantContextNotSetException();
    }
    return this.coupleId;
  }

  /**
   * Gets the current user ID
   */
  getUserId(): string {
    if (!this.userId) {
      throw new TenantContextNotSetException();
    }
    return this.userId;
  }

  /**
   * Checks if tenant context is set
   */
  hasContext(): boolean {
    return this.coupleId !== null && this.userId !== null;
  }

  /**
   * Clears tenant context (useful for testing)
   */
  clearContext(): void {
    this.coupleId = null;
    this.userId = null;
  }

  /**
   * Gets tenant context as object
   */
  getContext(): { coupleId: string; userId: string } {
    return {
      coupleId: this.getCoupleId(),
      userId: this.getUserId(),
    };
  }
}
