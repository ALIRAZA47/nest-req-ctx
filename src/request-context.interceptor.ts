import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestContextService } from './request-context.service';
import { RequestContextModuleOptions } from './interfaces';
import { REQUEST_CONTEXT_MODULE_OPTIONS } from './constants';
import { detectAdapterType } from './adapters';

/**
 * Interceptor for initializing request context
 * Use when middleware or guards cannot be used, or when interceptor-based initialization is preferred
 *
 * Note: Interceptors run after guards, so be careful about initialization order
 */
@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  constructor(
    private readonly contextService: RequestContextService,
    @Optional()
    @Inject(REQUEST_CONTEXT_MODULE_OPTIONS)
    private readonly options?: RequestContextModuleOptions,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    return new Observable((subscriber) => {
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

          // Continue with request handling
          next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        } catch (error) {
          subscriber.error(error);
        }
      });
    });
  }
}
