import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContextService } from '../request-context.service';

/**
 * Resolves a dot-notation path on an object
 */
function resolvePath(obj: any, path: string): any {
  if (!obj || !path) return undefined;

  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
}

/**
 * Parameter decorator that retrieves a value from the request object by key
 * Supports dot notation for nested properties
 * Works with both Express and Fastify
 *
 * @example
 * ```typescript
 * import { Controller, Get } from '@nestjs/common';
 * import { RequestKey } from '@kitstack/nest-req-ctx';
 *
 * interface User {
 *   id: string;
 *   email: string;
 *   profile: { name: string };
 * }
 *
 * @Controller()
 * export class AppController {
 *   // Get top-level property
 *   @Get()
 *   getUser(@RequestKey('user') user: User) {
 *     return { user };
 *   }
 *
 *   // Get nested property with dot notation
 *   @Get('email')
 *   getEmail(@RequestKey('user.email') email: string) {
 *     return { email };
 *   }
 *
 *   // Get deeply nested property
 *   @Get('name')
 *   getName(@RequestKey('user.profile.name') name: string) {
 *     return { name };
 *   }
 *
 *   // With generic type
 *   @Get('typed')
 *   getTyped(@RequestKey<string>('user.email') email: string) {
 *     return { email };
 *   }
 * }
 * ```
 */
export const RequestKey = createParamDecorator(
  <T = any>(key: string, ctx: ExecutionContext): T | undefined => {
    let request: any;

    try {
      // Try to get from context service first
      if (RequestContextService.hasInstance()) {
        const contextService = RequestContextService.getInstance();
        request = contextService.getRequest();
      }
    } catch {
      // Fall through to ExecutionContext
    }

    // Fallback to ExecutionContext if needed
    if (!request) {
      request = ctx.switchToHttp().getRequest();
    }

    if (!request) return undefined;

    // Support dot notation
    return resolvePath(request, key) as T | undefined;
  },
);

/**
 * Creates a typed RequestKey decorator factory
 * Useful for type-safe access to known request properties
 *
 * @example
 * ```typescript
 * interface MyRequest {
 *   user: User;
 *   tenant: Tenant;
 * }
 *
 * const TypedRequestKey = createTypedRequestKey<MyRequest>();
 *
 * @Controller()
 * export class AppController {
 *   @Get()
 *   handler(@TypedRequestKey('user') user: User) {
 *     return { user };
 *   }
 * }
 * ```
 */
export function createTypedRequestKey<TRequest extends Record<string, any>>() {
  return function <K extends keyof TRequest>(key: K): ParameterDecorator {
    return RequestKey(key as string);
  };
}

/**
 * Type alias for RequestKey return type
 */
export type RequestKeyType<T = any> = T | undefined;
