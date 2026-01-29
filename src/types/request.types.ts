import type { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import type { FastifyRequest, FastifyReply } from 'fastify';

/**
 * Unified request type that represents either Express or Fastify request
 */
export type UnifiedRequest = ExpressRequest | FastifyRequest;

/**
 * Unified response type that represents either Express or Fastify response
 */
export type UnifiedResponse = ExpressResponse | FastifyReply;

/**
 * Type guard to check if a request is an Express request
 *
 * @param request - The request object to check
 * @returns true if the request is an Express request
 *
 * @example
 * ```typescript
 * if (isExpressRequest(request)) {
 *   // TypeScript knows request is ExpressRequest here
 *   request.get('Content-Type');
 * }
 * ```
 */
export function isExpressRequest(request: UnifiedRequest): request is ExpressRequest {
  return (
    typeof request === 'object' &&
    request !== null &&
    'get' in request &&
    typeof (request as any).get === 'function' &&
    !('raw' in request)
  );
}

/**
 * Type guard to check if a request is a Fastify request
 *
 * @param request - The request object to check
 * @returns true if the request is a Fastify request
 *
 * @example
 * ```typescript
 * if (isFastifyRequest(request)) {
 *   // TypeScript knows request is FastifyRequest here
 *   request.server;
 * }
 * ```
 */
export function isFastifyRequest(request: UnifiedRequest): request is FastifyRequest {
  return (
    typeof request === 'object' &&
    request !== null &&
    'raw' in request &&
    'server' in request
  );
}

/**
 * Base context store type with optional internal properties
 */
export interface BaseContextStore {
  [key: string]: any;
}

/**
 * Context store type with request metadata
 *
 * @template TStore - Custom store properties
 */
export type ContextStore<TStore extends Record<string, any> = Record<string, any>> = {
  /** Internal: The raw request object */
  __request__?: UnifiedRequest;
  /** Internal: The adapter instance */
  __adapter__?: any;
  /** Internal: The adapter type */
  __adapter_type__?: 'express' | 'fastify' | 'auto';
} & TStore;

/**
 * Helper type to extract the user type from a request
 * Commonly used for authenticated requests
 *
 * @template TUser - The user type
 *
 * @example
 * ```typescript
 * interface AuthenticatedRequest extends RequestWithUser<User> {
 *   user: User;
 * }
 * ```
 */
export interface RequestWithUser<TUser = any> {
  user?: TUser;
}

/**
 * Common request properties that are typically set by middleware
 */
export interface CommonRequestProperties {
  /** Authenticated user (set by auth middleware/guard) */
  user?: any;
  /** Session data */
  session?: any;
  /** Request ID (often set by logging middleware) */
  requestId?: string;
  /** Correlation ID for distributed tracing */
  correlationId?: string;
  /** Tenant information for multi-tenant apps */
  tenant?: any;
}
