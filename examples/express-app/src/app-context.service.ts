import { Injectable } from '@nestjs/common';
import { BaseRequestContext, RequestContextService, InjectContext } from '../../../src';

/**
 * Example user interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar: string;
  };
  roles: string[];
}

/**
 * Define the shape of our context store
 */
export interface AppContextStore {
  user: User;
  requestId: string;
  tenantId?: string;
}

/**
 * Custom request context service
 * Extends BaseRequestContext to add domain-specific methods
 */
@Injectable()
export class AppRequestContext extends BaseRequestContext<AppContextStore> {
  constructor(@InjectContext() contextService: RequestContextService<AppContextStore>) {
    super(contextService);
  }

  /**
   * Get the current authenticated user
   */
  get currentUser(): User | undefined {
    return this.get('user');
  }

  /**
   * Set the current user
   */
  set currentUser(user: User) {
    this.set('user', user);
  }

  /**
   * Get the current request ID
   */
  get requestId(): string | undefined {
    return this.get('requestId');
  }

  /**
   * Check if a user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  /**
   * Check if the current user has a specific role
   */
  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  /**
   * Check if the current user is an admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  /**
   * Get the user's full name
   */
  getFullName(): string | undefined {
    const user = this.currentUser;
    if (!user) return undefined;
    return `${user.profile.firstName} ${user.profile.lastName}`;
  }

  /**
   * Get a specific user property using dot notation
   */
  getUserProperty<T>(path: string): T | undefined {
    return this.getByPath<T>(`user.${path}`);
  }
}
