import { Injectable, NestMiddleware, Inject, Optional } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../request-context.service';
import { RequestContextModuleOptions } from '../interfaces';
import { REQUEST_CONTEXT_MODULE_OPTIONS } from '../constants';

/**
 * Express middleware for initializing request context
 * Wraps each request in an AsyncLocalStorage context
 */
@Injectable()
export class ExpressContextMiddleware implements NestMiddleware {
  constructor(
    private readonly contextService: RequestContextService,
    @Optional()
    @Inject(REQUEST_CONTEXT_MODULE_OPTIONS)
    private readonly options?: RequestContextModuleOptions,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    this.contextService.run(() => {
      // Set the request object in context if enabled
      if (this.options?.setRequest !== false) {
        this.contextService.setRequest(req, this.options?.adapter ?? 'express');
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
