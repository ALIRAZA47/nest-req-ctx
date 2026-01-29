import { Type, ModuleMetadata, Provider } from '@nestjs/common';
import type { RouteInfo as NestRouteInfo } from '@nestjs/common/interfaces';
import { AdapterType } from '../adapters';
import { RequestContextService } from '../request-context.service';

/**
 * Determines how the context is initialized
 * - 'middleware': Uses middleware (recommended for most cases)
 * - 'guard': Uses a global guard
 * - 'interceptor': Uses a global interceptor
 */
export type ContextSetupType = 'middleware' | 'guard' | 'interceptor';

/**
 * Route information for exclusion patterns
 * Uses NestJS's RouteInfo interface for compatibility
 */
export type RouteInfo = NestRouteInfo;

/**
 * Configuration options for RequestContextModule.forRoot()
 */
export interface RequestContextModuleOptions {
  /**
   * Whether to register the module globally
   * When true, the module doesn't need to be imported in other modules
   * @default true
   */
  isGlobal?: boolean;

  /**
   * The adapter type to use for request handling
   * - 'express': Use Express adapter
   * - 'fastify': Use Fastify adapter
   * - 'auto': Auto-detect based on request object
   * @default 'auto'
   */
  adapter?: AdapterType;

  /**
   * How to initialize the context
   * - 'middleware': Initializes context via middleware (recommended)
   * - 'guard': Initializes context via global guard
   * - 'interceptor': Initializes context via global interceptor
   * @default 'middleware'
   */
  setupType?: ContextSetupType;

  /**
   * Whether to automatically set the request object in context
   * @default true
   */
  setRequest?: boolean;

  /**
   * Route patterns to exclude from context initialization
   * Only applies when setupType is 'middleware'
   *
   * @example
   * ```typescript
   * exclude: ['/health', { path: '/metrics', method: 'GET' }]
   * ```
   */
  exclude?: (string | RouteInfo)[];

  /**
   * Custom setup function called after context is initialized
   * Use this to set initial values in the context
   *
   * @example
   * ```typescript
   * setup: (ctx, req) => {
   *   ctx.set('requestId', req.headers['x-request-id']);
   * }
   * ```
   */
  setup?: (
    contextService: RequestContextService,
    request: any,
  ) => void | Promise<void>;
}

/**
 * Factory interface for async module configuration
 */
export interface RequestContextOptionsFactory {
  createRequestContextOptions():
    | Promise<RequestContextModuleOptions>
    | RequestContextModuleOptions;
}

/**
 * Configuration options for RequestContextModule.forRootAsync()
 */
export interface RequestContextModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  /**
   * Whether to register the module globally
   * @default true
   */
  isGlobal?: boolean;

  /**
   * Use an existing provider that implements RequestContextOptionsFactory
   */
  useExisting?: Type<RequestContextOptionsFactory>;

  /**
   * Use a class that implements RequestContextOptionsFactory
   */
  useClass?: Type<RequestContextOptionsFactory>;

  /**
   * Use a factory function to create the options
   *
   * @example
   * ```typescript
   * useFactory: (configService: ConfigService) => ({
   *   adapter: configService.get('HTTP_ADAPTER'),
   * }),
   * inject: [ConfigService],
   * ```
   */
  useFactory?: (
    ...args: any[]
  ) => Promise<RequestContextModuleOptions> | RequestContextModuleOptions;

  /**
   * Dependencies to inject into the factory function
   */
  inject?: any[];

  /**
   * Additional providers to register with the module
   */
  extraProviders?: Provider[];
}
