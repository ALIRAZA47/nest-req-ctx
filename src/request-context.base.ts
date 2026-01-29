import { Injectable } from '@nestjs/common';
import { RequestContextService } from './request-context.service';
import { RequestAdapter } from './adapters';

/**
 * Abstract base class for creating custom request context services
 * Extend this class to create domain-specific context with custom methods and getters
 *
 * @template TStore - The shape of the context store
 *
 * @example
 * ```typescript
 * interface AppContextStore {
 *   user: User;
 *   tenant: Tenant;
 *   correlationId: string;
 * }
 *
 * @Injectable()
 * export class AppRequestContext extends BaseRequestContext<AppContextStore> {
 *   constructor(contextService: RequestContextService<AppContextStore>) {
 *     super(contextService);
 *   }
 *
 *   get currentUser(): User | undefined {
 *     return this.get('user');
 *   }
 *
 *   set currentUser(user: User) {
 *     this.set('user', user);
 *   }
 *
 *   get currentTenant(): Tenant | undefined {
 *     return this.get('tenant');
 *   }
 *
 *   hasRole(role: string): boolean {
 *     return this.currentUser?.roles.includes(role) ?? false;
 *   }
 *
 *   isAdmin(): boolean {
 *     return this.hasRole('admin');
 *   }
 * }
 * ```
 */
@Injectable()
export abstract class BaseRequestContext<TStore extends Record<string, any> = Record<string, any>> {
  constructor(protected readonly contextService: RequestContextService<TStore>) {}

  /**
   * Gets a value from the context store
   *
   * @param key - The key to retrieve
   * @returns The value or undefined
   */
  protected get<K extends keyof TStore>(key: K): TStore[K] {
    return this.contextService.get(key);
  }

  /**
   * Sets a value in the context store
   *
   * @param key - The key to set
   * @param value - The value to store
   */
  protected set<K extends keyof TStore>(key: K, value: TStore[K]): void {
    this.contextService.set(key, value);
  }

  /**
   * Checks if a key exists in the context store
   *
   * @param key - The key to check
   * @returns true if the key exists
   */
  protected has<K extends keyof TStore>(key: K): boolean {
    return this.contextService.has(key);
  }

  /**
   * Deletes a value from the context store
   *
   * @param key - The key to delete
   * @returns true if the key was deleted
   */
  protected delete<K extends keyof TStore>(key: K): boolean {
    return this.contextService.delete(key);
  }

  /**
   * Gets a value using dot notation path
   *
   * @param path - The dot-notation path
   * @returns The value at the path or undefined
   */
  protected getByPath<T = any>(path: string): T | undefined {
    return this.contextService.getByPath<T>(path);
  }

  /**
   * Gets the entire context store
   *
   * @returns The complete store contents
   */
  protected getAll(): TStore {
    return this.contextService.getAll();
  }

  /**
   * Checks if the context is currently active
   */
  get isActive(): boolean {
    return this.contextService.isActive();
  }

  /**
   * Gets the raw request object
   */
  protected getRequest<TRequest = any>(): TRequest | undefined {
    return this.contextService.getRequest<TRequest>();
  }

  /**
   * Gets the current adapter
   */
  protected getAdapter(): RequestAdapter | undefined {
    return this.contextService.getAdapter();
  }

  /**
   * Gets a header value
   *
   * @param key - The header name
   * @returns The header value or undefined
   */
  protected getHeader(key: string): string | string[] | undefined {
    return this.contextService.getHeader(key);
  }

  /**
   * Gets all headers
   *
   * @returns All headers
   */
  protected getHeaders(): Record<string, string | string[] | undefined> {
    return this.contextService.getHeaders();
  }

  /**
   * Gets a property from the request object
   *
   * @param key - The property key (supports dot notation)
   * @returns The property value or undefined
   */
  protected getRequestProperty<T = any>(key: string): T | undefined {
    return this.contextService.getRequestProperty<T>(key);
  }
}
