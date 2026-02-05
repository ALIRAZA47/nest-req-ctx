import { Injectable, NestMiddleware, Inject, Optional } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { RequestContextService } from '../request-context.service';
import { RequestContextModuleOptions } from '../interfaces';
import { REQUEST_CONTEXT_MODULE_OPTIONS } from '../constants';

/**
 * Fastify middleware for initializing request context
 * Wraps each request in an AsyncLocalStorage context
 *
 * Note: In Fastify with NestJS, middleware is implemented via hooks.
 * This class provides the middleware logic that will be wrapped in a hook.
 */
@Injectable()
export class FastifyContextMiddleware implements NestMiddleware {
  constructor(
    private readonly contextService: RequestContextService,
    @Optional()
    @Inject(REQUEST_CONTEXT_MODULE_OPTIONS)
    private readonly options?: RequestContextModuleOptions,
  ) {}

  use(req: FastifyRequest, res: FastifyReply, next: (error?: any) => void): void {
    this.contextService.run(() => {
      // Set the request object in context if enabled
      if (this.options?.setRequest !== false) {
        this.contextService.setRequest(req, this.options?.adapter ?? 'auto');
      }

      // Call custom setup function if provided
      if (this.options?.setup) {
        const result = this.options.setup(this.contextService, req);

        // Handle async setup
        if (result instanceof Promise) {
          result
            .then(() => next())
            .catch((err) => next(err));
          return;
        }
      }

      next();
    });
  }
}

/**
 * Creates a Fastify plugin/hook for initializing request context
 * Use this when you need to manually configure the context hook
 *
 * @param contextService - The RequestContextService instance
 * @param options - Module options
 * @returns A Fastify preHandler hook function
 */
export function createFastifyContextHook(
  contextService: RequestContextService,
  options?: RequestContextModuleOptions,
) {
  return async (req: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    return new Promise((resolve, reject) => {
      contextService.run(async () => {
        try {
          // Set the request object in context if enabled
          if (options?.setRequest !== false) {
            contextService.setRequest(req, options?.adapter ?? 'auto');
          }

          // Call custom setup function if provided
          if (options?.setup) {
            await options.setup(contextService, req);
          }

          resolve();
        } catch (error) {
          reject(error);
        }
      });
    });
  };
}
