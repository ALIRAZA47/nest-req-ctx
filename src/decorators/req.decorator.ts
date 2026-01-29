import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContextService } from '../request-context.service';

/**
 * Parameter decorator that retrieves the request object from the context
 * Works with both Express and Fastify
 *
 * @example
 * ```typescript
 * import { Controller, Get } from '@nestjs/common';
 * import { Req } from '@kitstack/nest-req-ctx';
 * import { Request } from 'express';
 *
 * @Controller()
 * export class AppController {
 *   @Get()
 *   handler(@Req() request: Request) {
 *     return { path: request.path };
 *   }
 * }
 * ```
 */
export const Req = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    try {
      // Try to get from context service first
      if (RequestContextService.hasInstance()) {
        const contextService = RequestContextService.getInstance();
        const request = contextService.getRequest();
        if (request) {
          return request;
        }
      }
    } catch {
      // Fall through to ExecutionContext
    }

    // Fallback to ExecutionContext if service not available
    return ctx.switchToHttp().getRequest();
  },
);

/**
 * Type alias for better TypeScript inference when using the decorator
 *
 * @example
 * ```typescript
 * import { Req, ReqType } from '@kitstack/nest-req-ctx';
 * import { Request } from 'express';
 *
 * @Get()
 * handler(@Req() request: ReqType<Request>) {
 *   // request is typed as Request
 * }
 * ```
 */
export type ReqType<T = any> = T;
