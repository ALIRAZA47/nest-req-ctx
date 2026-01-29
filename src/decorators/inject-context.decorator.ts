import { Inject } from '@nestjs/common';
import { REQUEST_CONTEXT_SERVICE } from '../constants';

/**
 * Property/parameter decorator that injects the RequestContextService
 * Alternative to direct class injection
 *
 * @example
 * ```typescript
 * import { Injectable } from '@nestjs/common';
 * import { InjectContext, RequestContextService } from '@kitstack/nest-req-ctx';
 *
 * @Injectable()
 * export class MyService {
 *   constructor(
 *     @InjectContext() private readonly ctx: RequestContextService,
 *   ) {}
 *
 *   getCurrentUser() {
 *     return this.ctx.get('user');
 *   }
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With typed context store
 * interface MyStore {
 *   user: User;
 *   tenant: Tenant;
 * }
 *
 * @Injectable()
 * export class MyService {
 *   constructor(
 *     @InjectContext() private readonly ctx: RequestContextService<MyStore>,
 *   ) {}
 *
 *   getCurrentUser(): User {
 *     return this.ctx.get('user');
 *   }
 * }
 * ```
 */
export const InjectContext = (): PropertyDecorator & ParameterDecorator =>
  Inject(REQUEST_CONTEXT_SERVICE);
