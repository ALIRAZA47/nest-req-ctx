import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContextService } from '../request-context.service';

/**
 * Parameter decorator that retrieves all headers or a specific header from the request
 * Works with both Express and Fastify
 *
 * @param headerName - Optional header name to retrieve (case-insensitive)
 *
 * @example
 * ```typescript
 * import { Controller, Get } from '@nestjs/common';
 * import { Headers } from '@kitstack/nest-req-ctx';
 *
 * @Controller()
 * export class AppController {
 *   // Get all headers
 *   @Get()
 *   getAllHeaders(@Headers() headers: Record<string, string>) {
 *     return { headers };
 *   }
 *
 *   // Get specific header
 *   @Get('auth')
 *   getAuth(@Headers('authorization') auth: string) {
 *     return { auth };
 *   }
 * }
 * ```
 */
export const Headers = createParamDecorator(
  (headerName: string | undefined, ctx: ExecutionContext) => {
    try {
      // Try to get from context service first
      if (RequestContextService.hasInstance()) {
        const contextService = RequestContextService.getInstance();

        if (headerName) {
          return contextService.getHeader(headerName);
        }

        return contextService.getHeaders();
      }
    } catch {
      // Fall through to ExecutionContext
    }

    // Fallback to ExecutionContext
    const request = ctx.switchToHttp().getRequest();

    if (headerName) {
      return request.headers?.[headerName.toLowerCase()];
    }

    return request.headers || {};
  },
);

/**
 * Parameter decorator that retrieves a specific header from the request
 * Alias for @Headers('key')
 *
 * @param key - The header name to retrieve (case-insensitive)
 *
 * @example
 * ```typescript
 * import { Controller, Get } from '@nestjs/common';
 * import { Header } from '@kitstack/nest-req-ctx';
 *
 * @Controller()
 * export class AppController {
 *   @Get()
 *   handler(
 *     @Header('x-request-id') requestId: string,
 *     @Header('authorization') auth: string,
 *   ) {
 *     return { requestId, auth };
 *   }
 * }
 * ```
 */
export const Header = (key: string): ParameterDecorator => Headers(key);

/**
 * Type alias for headers object
 */
export type HeadersType<T = Record<string, string | string[] | undefined>> = T;

/**
 * Type alias for single header value
 */
export type HeaderType<T = string | string[] | undefined> = T;
