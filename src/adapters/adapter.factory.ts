import { RequestAdapter, AdapterType } from './adapter.interface';
import { ExpressAdapter, expressAdapter } from './express.adapter';
import { FastifyAdapter, fastifyAdapter } from './fastify.adapter';

/**
 * Detects the adapter type from a request object
 * @param request - The request object to detect
 * @returns The detected adapter type
 */
export function detectAdapterType(request: any): 'express' | 'fastify' {
  // Fastify requests have specific properties
  if (request && typeof request.raw !== 'undefined' && typeof request.server !== 'undefined') {
    return 'fastify';
  }

  // Default to Express
  return 'express';
}

/**
 * Gets the appropriate adapter based on type or auto-detection
 * @param type - The adapter type ('express', 'fastify', or 'auto')
 * @param request - Optional request object for auto-detection
 * @returns The appropriate RequestAdapter instance
 */
export function getAdapter(type: AdapterType, request?: any): RequestAdapter {
  if (type === 'auto' && request) {
    const detectedType = detectAdapterType(request);
    return detectedType === 'fastify' ? fastifyAdapter : expressAdapter;
  }

  if (type === 'fastify') {
    return fastifyAdapter;
  }

  return expressAdapter;
}

/**
 * Creates a new adapter instance based on type
 * @param type - The adapter type
 * @returns A new RequestAdapter instance
 */
export function createAdapter(type: Exclude<AdapterType, 'auto'>): RequestAdapter {
  if (type === 'fastify') {
    return new FastifyAdapter();
  }
  return new ExpressAdapter();
}

export { ExpressAdapter, FastifyAdapter, expressAdapter, fastifyAdapter };
