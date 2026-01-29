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
 * Note: Guards run after middleware, so if using both, context will be initialized twice.
 * Choose either middleware or guard, not both.
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
