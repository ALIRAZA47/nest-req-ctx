import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestContextService } from '../request-context.service';

/**
 * Parameter decorator that retrieves a value from the request context store
 * Supports dot notation for nested properties
 *
 * This decorator accesses the context store (set via contextService.set()),
 * not the request object itself. Use @RequestKey for request properties.
 *
 * @example
 * ```typescript
 * import { Controller, Get } from '@nestjs/common';
 * import { ContextValue } from '@kitstack/nest-req-ctx';
 *
 * interface User {
 *   id: string;
 *   email: string;
 *   profile: { name: string };
 * }
 *
 * @Controller()
 * export class AppController {
 *   // Get top-level context value
 *   @Get()
 *   getUser(@ContextValue('user') user: User) {
 *     return { user };
 *   }
 *
 *   // Get nested context value with dot notation
 *   @Get('email')
 *   getEmail(@ContextValue('user.email') email: string) {
 *     return { email };
 *   }
 *
 *   // With generic type for compile-time safety
 *   @Get('typed')
 *   getTyped(@ContextValue<User>('user') user: User) {
 *     return { user };
 *   }
 *
 *   // Get deeply nested value
 *   @Get('name')
 *   getName(@ContextValue<string>('user.profile.name') name: string) {
 *     return { name };
 *   }
 * }
 * ```
 */
export const ContextValue = createParamDecorator(
  <T = any>(path: string, _ctx: ExecutionContext): T | undefined => {
    try {
      if (RequestContextService.hasInstance()) {
        const contextService = RequestContextService.getInstance();
        return contextService.getByPath<T>(path);
      }
    } catch {
      // Return undefined if context is not available
    }

    return undefined;
  },
);

/**
 * Creates a typed ContextValue decorator factory with autocomplete support
 * Provides compile-time type safety and IDE autocomplete for context paths
 *
 * @example
 * ```typescript
 * interface MyContextStore {
 *   user: {
 *     id: string;
 *     profile: {
 *       firstName: string;
 *       lastName: string;
 *       email: string;
 *     };
 *   };
 *   tenant: {
 *     id: string;
 *     name: string;
 *   };
 *   requestId: string;
 * }
 *
 * // Create typed decorator factory
 * const TypedContext = createTypedContextValue<MyContextStore>();
 *
 * @Controller()
 * export class AppController {
 *   @Get()
 *   handler(
 *     // IDE will provide autocomplete for valid paths
 *     @TypedContext('user.profile.email') email: string,
 *     @TypedContext('tenant.name') tenantName: string,
 *     @TypedContext('requestId') requestId: string,
 *   ) {
 *     return { email, tenantName, requestId };
 *   }
 * }
 * ```
 */
export function createTypedContextValue<TStore extends Record<string, any>>() {
  return function <K extends string>(path: K): ParameterDecorator {
    return ContextValue(path);
  };
}

/**
 * Type alias for ContextValue return type
 */
export type ContextValueType<T = any> = T | undefined;
