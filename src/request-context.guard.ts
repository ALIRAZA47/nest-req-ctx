import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
  Optional,
} from '@nestjs/common';
import { RequestContextService } from './request-context.service';
import { RequestContextModuleOptions } from './interfaces';
import { REQUEST_CONTEXT_MODULE_OPTIONS } from './constants';
import { detectAdapterType } from './adapters';

/**
 * Guard for initializing request context
 * Use when middleware cannot be used or when guard-based initialization is preferred
 *
 * When used together with middleware, this guard acts as a safety net:
 * - If context is already initialized by middleware, it skips re-initialization
 * - If context is not initialized (e.g., middleware was skipped), it initializes it
 */
@Injectable()
export class RequestContextGuard implements CanActivate {
  constructor(
    private readonly contextService: RequestContextService,
    @Optional()
    @Inject(REQUEST_CONTEXT_MODULE_OPTIONS)
    private readonly options?: RequestContextModuleOptions,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if context is already initialized (e.g., by middleware)
    const existingStore = this.contextService.getStore();
    if (existingStore) {
      // Context already exists, no need to re-initialize
      return true;
    }

    const request = context.switchToHttp().getRequest();

    return new Promise<boolean>((resolve, reject) => {
      this.contextService.run(async () => {
        try {
          // Determine adapter type
          const adapterType =
            this.options?.adapter === 'auto' || !this.options?.adapter
              ? detectAdapterType(request)
              : this.options.adapter;

          // Set the request object in context if enabled
          if (this.options?.setRequest !== false) {
            this.contextService.setRequest(request, adapterType);
          }

          // Call custom setup function if provided
          if (this.options?.setup) {
            await this.options.setup(this.contextService, request);
          }

          resolve(true);
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
