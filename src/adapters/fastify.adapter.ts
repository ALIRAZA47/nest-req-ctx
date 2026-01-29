import type { FastifyRequest } from 'fastify';
import { RequestAdapter } from './adapter.interface';

/**
 * Fastify-specific request adapter
 * Provides unified access to Fastify request properties
 */
export class FastifyAdapter implements RequestAdapter<FastifyRequest> {
  getHeaders(request: FastifyRequest): Record<string, string | string[] | undefined> {
    return request.headers as Record<string, string | string[] | undefined>;
  }

  getHeader(request: FastifyRequest, key: string): string | string[] | undefined {
    return request.headers[key.toLowerCase()];
  }

  getPath(request: FastifyRequest): string {
    return request.url;
  }

  getMethod(request: FastifyRequest): string {
    return request.method;
  }

  getBody(request: FastifyRequest): any {
    return request.body;
  }

  getQuery(request: FastifyRequest): Record<string, any> {
    return request.query as Record<string, any>;
  }

  getParams(request: FastifyRequest): Record<string, string> {
    return request.params as Record<string, string>;
  }

  getProperty<T = any>(request: FastifyRequest, key: string): T | undefined {
    return (request as any)[key] as T | undefined;
  }

  setProperty<T = any>(request: FastifyRequest, key: string, value: T): void {
    (request as any)[key] = value;
  }

  getRawRequest(request: FastifyRequest): FastifyRequest {
    return request;
  }
}

/**
 * Singleton instance of FastifyAdapter
 */
export const fastifyAdapter = new FastifyAdapter();
