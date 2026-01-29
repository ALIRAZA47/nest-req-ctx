import type { Request as ExpressRequest } from 'express';
import { RequestAdapter } from './adapter.interface';

/**
 * Express-specific request adapter
 * Provides unified access to Express request properties
 */
export class ExpressAdapter implements RequestAdapter<ExpressRequest> {
  getHeaders(request: ExpressRequest): Record<string, string | string[] | undefined> {
    return request.headers as Record<string, string | string[] | undefined>;
  }

  getHeader(request: ExpressRequest, key: string): string | string[] | undefined {
    // Express's req.get() returns string | undefined, but headers can be string[]
    const value = request.headers[key.toLowerCase()];
    return value;
  }

  getPath(request: ExpressRequest): string {
    return request.path;
  }

  getMethod(request: ExpressRequest): string {
    return request.method;
  }

  getBody(request: ExpressRequest): any {
    return request.body;
  }

  getQuery(request: ExpressRequest): Record<string, any> {
    return request.query as Record<string, any>;
  }

  getParams(request: ExpressRequest): Record<string, string> {
    return request.params;
  }

  getProperty<T = any>(request: ExpressRequest, key: string): T | undefined {
    return (request as any)[key] as T | undefined;
  }

  setProperty<T = any>(request: ExpressRequest, key: string, value: T): void {
    (request as any)[key] = value;
  }

  getRawRequest(request: ExpressRequest): ExpressRequest {
    return request;
  }
}

/**
 * Singleton instance of ExpressAdapter
 */
export const expressAdapter = new ExpressAdapter();
