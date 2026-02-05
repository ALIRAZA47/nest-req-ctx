import {
  DynamicModule,
  Module,
  MiddlewareConsumer,
  NestModule,
  Inject,
  Optional,
  Provider,
  Type,
} from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR, HttpAdapterHost } from '@nestjs/core';
import { RequestContextService } from './request-context.service';
import { ExpressContextMiddleware } from './middleware/express.middleware';
import { FastifyContextMiddleware } from './middleware/fastify.middleware';
import { RequestContextGuard } from './request-context.guard';
import { RequestContextInterceptor } from './request-context.interceptor';
import {
  RequestContextModuleOptions,
  RequestContextModuleAsyncOptions,
  RequestContextOptionsFactory,
} from './interfaces';
import {
  REQUEST_CONTEXT_MODULE_OPTIONS,
  REQUEST_CONTEXT_SERVICE,
} from './constants';

const DEFAULT_MODULE_OPTIONS: Required<
  Pick<RequestContextModuleOptions, 'adapter' | 'setupType' | 'setRequest'>
> = {
  adapter: 'auto',
  setupType: 'middleware',
  setRequest: true,
};

/**
 * Dynamic module for request context management
 * Provides request-scoped context using AsyncLocalStorage
 *
 * @example
 * ```typescript
 * // Basic usage with Express (default)
 * @Module({
 *   imports: [
 *     RequestContextModule.forRoot({
 *       isGlobal: true,
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // With Fastify
 * @Module({
 *   imports: [
 *     RequestContextModule.forRoot({
 *       adapter: 'fastify',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 *
 * // Async configuration
 * @Module({
 *   imports: [
 *     RequestContextModule.forRootAsync({
 *       useFactory: (config: ConfigService) => ({
 *         adapter: config.get('HTTP_ADAPTER'),
 *       }),
 *       inject: [ConfigService],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * ```
 */
@Module({})
export class RequestContextModule implements NestModule {
  private readonly options: RequestContextModuleOptions;

  constructor(
    @Optional()
    @Inject(REQUEST_CONTEXT_MODULE_OPTIONS)
    options?: RequestContextModuleOptions,
    @Optional() private readonly httpAdapterHost?: HttpAdapterHost,
  ) {
    this.options = RequestContextModule.applyDefaults(options);
  }

  private static applyDefaults(
    options: RequestContextModuleOptions = {},
  ): RequestContextModuleOptions {
    return { ...DEFAULT_MODULE_OPTIONS, ...options };
  }

  /**
   * Configures the module with synchronous options
   *
   * @param options - Module configuration options
   * @returns A configured DynamicModule
   */
  static forRoot(options: RequestContextModuleOptions = {}): DynamicModule {
    const normalizedOptions = RequestContextModule.applyDefaults(options);

    const providers: Provider[] = [
      {
        provide: REQUEST_CONTEXT_MODULE_OPTIONS,
        useValue: normalizedOptions,
      },
      RequestContextService,
      {
        provide: REQUEST_CONTEXT_SERVICE,
        useExisting: RequestContextService,
      },
    ];

    // Add guard or interceptor based on setup type
    // When using middleware, also add guard as a safety net
    if (normalizedOptions.setupType === 'guard') {
      providers.push({
        provide: APP_GUARD,
        useClass: RequestContextGuard,
      });
    } else if (normalizedOptions.setupType === 'interceptor') {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: RequestContextInterceptor,
      });
    } else {
      // Default: middleware setup - also add guard as fallback
      // Guard will check if context exists and skip if already initialized
      providers.push({
        provide: APP_GUARD,
        useClass: RequestContextGuard,
      });
    }

    const module: DynamicModule = {
      module: RequestContextModule,
      providers,
      exports: [RequestContextService, REQUEST_CONTEXT_SERVICE],
    };

    if (normalizedOptions.isGlobal !== false) {
      return { ...module, global: true };
    }

    return module;
  }

  /**
   * Configures the module with asynchronous options
   * Useful when configuration depends on other services
   *
   * @param options - Async module configuration options
   * @returns A configured DynamicModule
   */
  static forRootAsync(options: RequestContextModuleAsyncOptions): DynamicModule {
    const providers: Provider[] = [
      ...this.createAsyncProviders(options),
      RequestContextService,
      {
        provide: REQUEST_CONTEXT_SERVICE,
        useExisting: RequestContextService,
      },
    ];

    // Note: For async configuration, we can't determine setupType at module definition time
    // The guard will be added dynamically based on the resolved options
    // We'll add it here as a safety net - it will check if context exists before initializing
    providers.push({
      provide: APP_GUARD,
      useClass: RequestContextGuard,
    });

    if (options.extraProviders) {
      providers.push(...options.extraProviders);
    }

    const module: DynamicModule = {
      module: RequestContextModule,
      imports: options.imports || [],
      providers,
      exports: [RequestContextService, REQUEST_CONTEXT_SERVICE],
    };

    if (options.isGlobal !== false) {
      return { ...module, global: true };
    }

    return module;
  }

  /**
   * Creates async providers for module configuration
   */
  private static createAsyncProviders(
    options: RequestContextModuleAsyncOptions,
  ): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }

    const useClass = options.useClass as Type<RequestContextOptionsFactory>;

    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: useClass,
        useClass,
      },
    ];
  }

  /**
   * Creates the async options provider
   */
  private static createAsyncOptionsProvider(
    options: RequestContextModuleAsyncOptions,
  ): Provider {
    if (options.useFactory) {
      return {
        provide: REQUEST_CONTEXT_MODULE_OPTIONS,
        useFactory: async (...args: any[]) => {
          const config = await options.useFactory!(...args);
          return RequestContextModule.applyDefaults(config);
        },
        inject: options.inject || [],
      };
    }

    const inject = [
      (options.useClass || options.useExisting) as Type<RequestContextOptionsFactory>,
    ];

    return {
      provide: REQUEST_CONTEXT_MODULE_OPTIONS,
      useFactory: async (optionsFactory: RequestContextOptionsFactory) => {
        const config = await optionsFactory.createRequestContextOptions();
        return RequestContextModule.applyDefaults(config);
      },
      inject,
    };
  }

  /**
   * Configures middleware for request context initialization
   * Only applies when setupType is 'middleware' (default)
   */
  configure(consumer: MiddlewareConsumer): void {
    const options = this.options;

    // Only configure middleware if setupType is 'middleware' (default)
    if (options.setupType && options.setupType !== 'middleware') {
      return;
    }

    // Select middleware based on adapter type
    const adapterType = this.resolveAdapterType(options);
    const MiddlewareClass =
      adapterType === 'fastify'
        ? FastifyContextMiddleware
        : ExpressContextMiddleware;

    let middlewareConfig = consumer.apply(MiddlewareClass);

    // Apply exclusions if specified
    if (options.exclude && options.exclude.length > 0) {
      middlewareConfig = middlewareConfig.exclude(...options.exclude);
    }

    // Apply to all routes
    middlewareConfig.forRoutes('*');
  }

  private resolveAdapterType(
    options: RequestContextModuleOptions,
  ): 'express' | 'fastify' {
    if (options.adapter && options.adapter !== 'auto') {
      return options.adapter;
    }

    const detectedAdapter = this.httpAdapterHost?.httpAdapter?.getType?.();
    return detectedAdapter === 'fastify' ? 'fastify' : 'express';
  }
}
