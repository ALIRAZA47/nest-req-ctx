/**
 * Common interface for request adapters (Express/Fastify)
 * Provides a unified API for accessing request data regardless of the underlying framework
 */
export interface RequestAdapter<TRequest = any> {
  /**
   * Get all headers from the request
   */
  getHeaders(request: TRequest): Record<string, string | string[] | undefined>;

  /**
   * Get a specific header value by key (case-insensitive)
   */
  getHeader(request: TRequest, key: string): string | string[] | undefined;

  /**
   * Get the request path/URL
   */
  getPath(request: TRequest): string;

  /**
   * Get the HTTP method (GET, POST, etc.)
   */
  getMethod(request: TRequest): string;

  /**
   * Get the request body
   */
  getBody(request: TRequest): any;

  /**
   * Get query parameters
   */
  getQuery(request: TRequest): Record<string, any>;

  /**
   * Get route parameters
   */
  getParams(request: TRequest): Record<string, string>;

  /**
   * Get a custom property from the request object
   * Used for accessing properties set by middleware/guards (e.g., req.user)
   */
  getProperty<T = any>(request: TRequest, key: string): T | undefined;

  /**
   * Set a custom property on the request object
   */
  setProperty<T = any>(request: TRequest, key: string, value: T): void;

  /**
   * Get the raw request object
   */
  getRawRequest(request: TRequest): TRequest;
}

/**
 * Type for adapter identification
 */
export type AdapterType = 'express' | 'fastify' | 'auto';
