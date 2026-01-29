import { Injectable, OnModuleInit } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { RequestAdapter, AdapterType, getAdapter } from './adapters';

/**
 * Internal keys used by the service
 */
const INTERNAL_KEYS = {
  REQUEST: '__request__',
  ADAPTER: '__adapter__',
  ADAPTER_TYPE: '__adapter_type__',
} as const;

/**
 * Core request context service using AsyncLocalStorage
 * Provides type-safe context storage throughout the request lifecycle
 *
 * @template TStore - The shape of the context store
 *
 * @example
 * ```typescript
 * interface MyStore {
 *   user: User;
 *   tenantId: string;
 * }
 *
 * @Injectable()
 * class MyService {
 *   constructor(private ctx: RequestContextService<MyStore>) {}
 *
 *   getUser(): User {
 *     return this.ctx.get('user');
 *   }
 * }
 * ```
 */
@Injectable()
export class RequestContextService<TStore extends Record<string, any> = Record<string, any>>
  implements OnModuleInit
{
  private static instance: RequestContextService<any>;
  private readonly asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

  /**
   * Called when the module is initialized
   * Sets the static instance for use in decorators
   */
  onModuleInit(): void {
    RequestContextService.instance = this;
  }

  /**
   * Gets the singleton instance of the service
   * Used by decorators to access the service outside of DI context
   *
   * @throws Error if the service hasn't been initialized
   */
  static getInstance<T extends Record<string, any> = Record<string, any>>(): RequestContextService<T> {
    if (!RequestContextService.instance) {
      throw new Error(
        'RequestContextService not initialized. Ensure RequestContextModule is imported in your AppModule.',
      );
    }
    return RequestContextService.instance as RequestContextService<T>;
  }

  /**
   * Checks if a static instance exists
   */
  static hasInstance(): boolean {
    return !!RequestContextService.instance;
  }

  /**
   * Gets the current context store
   * @returns The current Map store or undefined if outside context
   */
  private getStore(): Map<string, any> | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Runs a callback within a new context
   * All code within the callback will have access to the context store
   *
   * @param callback - The function to run within the context
   * @param initialStore - Optional initial values for the store
   * @returns The return value of the callback
   *
   * @example
   * ```typescript
   * contextService.run(() => {
   *   contextService.set('user', currentUser);
   *   // ... rest of request handling
   * });
   * ```
   */
  run<T>(callback: () => T, initialStore?: Partial<TStore>): T {
    const store = new Map<string, any>();

    if (initialStore) {
      Object.entries(initialStore).forEach(([key, value]) => {
        store.set(key, value);
      });
    }

    return this.asyncLocalStorage.run(store, callback);
  }

  /**
   * Runs an async callback within a new context
   *
   * @param callback - The async function to run within the context
   * @param initialStore - Optional initial values for the store
   * @returns A promise that resolves to the callback's return value
   */
  async runAsync<T>(
    callback: () => Promise<T>,
    initialStore?: Partial<TStore>,
  ): Promise<T> {
    const store = new Map<string, any>();

    if (initialStore) {
      Object.entries(initialStore).forEach(([key, value]) => {
        store.set(key, value);
      });
    }

    return this.asyncLocalStorage.run(store, callback);
  }

  /**
   * Checks if currently within an active context
   */
  isActive(): boolean {
    return this.getStore() !== undefined;
  }

  /**
   * Sets a value in the current context
   *
   * @param key - The key to set
   * @param value - The value to store
   * @throws Error if called outside of a context
   *
   * @example
   * ```typescript
   * contextService.set('user', { id: '123', name: 'John' });
   * ```
   */
  set<K extends keyof TStore>(key: K, value: TStore[K]): void;
  set(key: string, value: any): void;
  set(key: string, value: any): void {
    const store = this.getStore();
    if (!store) {
      throw new Error(
        'No active request context. Ensure middleware/guard/interceptor is configured.',
      );
    }
    store.set(key, value);
  }

  /**
   * Gets a value from the current context
   *
   * @param key - The key to retrieve
   * @returns The value or undefined if not found
   *
   * @example
   * ```typescript
   * const user = contextService.get('user');
   * ```
   */
  get<K extends keyof TStore>(key: K): TStore[K];
  get<T = any>(key: string): T | undefined;
  get(key: string): any {
    const store = this.getStore();
    return store?.get(key);
  }

  /**
   * Checks if a key exists in the current context
   *
   * @param key - The key to check
   * @returns true if the key exists
   */
  has<K extends keyof TStore>(key: K): boolean;
  has(key: string): boolean;
  has(key: string): boolean {
    const store = this.getStore();
    return store?.has(key) ?? false;
  }

  /**
   * Deletes a value from the current context
   *
   * @param key - The key to delete
   * @returns true if the key was deleted
   */
  delete<K extends keyof TStore>(key: K): boolean;
  delete(key: string): boolean;
  delete(key: string): boolean {
    const store = this.getStore();
    return store?.delete(key) ?? false;
  }

  /**
   * Gets a value using dot notation path
   * Supports deeply nested properties
   *
   * @param path - The dot-notation path (e.g., 'user.profile.name')
   * @returns The value at the path or undefined
   *
   * @example
   * ```typescript
   * const email = contextService.getByPath<string>('user.profile.email');
   * ```
   */
  getByPath<T = any>(path: string): T | undefined {
    if (!path) return undefined;

    const parts = path.split('.');
    let current: any = this.get(parts[0]);

    for (let i = 1; i < parts.length && current !== undefined && current !== null; i++) {
      current = current[parts[i]];
    }

    return current as T | undefined;
  }

  /**
   * Gets the entire store as an object
   *
   * @returns A copy of the store contents (excluding internal keys)
   */
  getAll(): TStore {
    const store = this.getStore();
    if (!store) return {} as TStore;

    const result: Record<string, any> = {};
    store.forEach((value, key) => {
      // Exclude internal keys
      if (!key.startsWith('__')) {
        result[key] = value;
      }
    });

    return result as TStore;
  }

  /**
   * Clears all values in the current context
   * Note: This also clears internal values like request and adapter
   */
  clear(): void {
    const store = this.getStore();
    if (store) {
      store.clear();
    }
  }

  /**
   * Sets the request object in the context
   *
   * @param request - The request object (Express or Fastify)
   * @param adapterType - The adapter type to use
   */
  setRequest<TRequest = any>(request: TRequest, adapterType: AdapterType = 'auto'): void {
    this.set(INTERNAL_KEYS.REQUEST as any, request);
    this.set(INTERNAL_KEYS.ADAPTER_TYPE as any, adapterType);

    // Pre-resolve and cache the adapter
    const adapter = getAdapter(adapterType, request);
    this.set(INTERNAL_KEYS.ADAPTER as any, adapter);
  }

  /**
   * Gets the request object from the context
   *
   * @returns The request object or undefined
   */
  getRequest<TRequest = any>(): TRequest | undefined {
    return this.get(INTERNAL_KEYS.REQUEST as any) as TRequest | undefined;
  }

  /**
   * Gets the current adapter
   *
   * @returns The RequestAdapter instance or undefined
   */
  getAdapter(): RequestAdapter | undefined {
    return this.get(INTERNAL_KEYS.ADAPTER as any) as RequestAdapter | undefined;
  }

  /**
   * Gets the adapter type
   *
   * @returns The adapter type or undefined
   */
  getAdapterType(): AdapterType | undefined {
    return this.get(INTERNAL_KEYS.ADAPTER_TYPE as any) as AdapterType | undefined;
  }

  /**
   * Convenience method to get a header value
   *
   * @param key - The header name (case-insensitive)
   * @returns The header value or undefined
   */
  getHeader(key: string): string | string[] | undefined {
    const adapter = this.getAdapter();
    const request = this.getRequest();

    if (!adapter || !request) return undefined;

    return adapter.getHeader(request, key);
  }

  /**
   * Convenience method to get all headers
   *
   * @returns All headers or an empty object
   */
  getHeaders(): Record<string, string | string[] | undefined> {
    const adapter = this.getAdapter();
    const request = this.getRequest();

    if (!adapter || !request) return {};

    return adapter.getHeaders(request);
  }

  /**
   * Convenience method to get a request property
   * Supports dot notation for nested access
   *
   * @param key - The property key or dot-notation path
   * @returns The property value or undefined
   */
  getRequestProperty<T = any>(key: string): T | undefined {
    const adapter = this.getAdapter();
    const request = this.getRequest();

    if (!adapter || !request) return undefined;

    // Check if it's a dot-notation path
    if (key.includes('.')) {
      const parts = key.split('.');
      let current: any = adapter.getProperty(request, parts[0]);

      for (let i = 1; i < parts.length && current !== undefined && current !== null; i++) {
        current = current[parts[i]];
      }

      return current as T | undefined;
    }

    return adapter.getProperty(request, key);
  }
}
