// Module
export { RequestContextModule } from './request-context.module';

// Service
export { RequestContextService } from './request-context.service';
export { BaseRequestContext } from './request-context.base';

// Middleware
export { ExpressContextMiddleware } from './middleware/express.middleware';
export {
  FastifyContextMiddleware,
  createFastifyContextHook,
} from './middleware/fastify.middleware';

// Guard & Interceptor
export { RequestContextGuard } from './request-context.guard';
export { RequestContextInterceptor } from './request-context.interceptor';

// Adapters
export {
  RequestAdapter,
  AdapterType,
  ExpressAdapter,
  FastifyAdapter,
  expressAdapter,
  fastifyAdapter,
  detectAdapterType,
  getAdapter,
  createAdapter,
} from './adapters';

// Decorators
export {
  Req,
  ReqType,
  Headers,
  Header,
  HeadersType,
  HeaderType,
  RequestKey,
  createTypedRequestKey,
  RequestKeyType,
  ContextValue,
  createTypedContextValue,
  ContextValueType,
  InjectContext,
} from './decorators';

// Interfaces
export type {
  ContextSetupType,
  RouteInfo,
  RequestContextModuleOptions,
  RequestContextOptionsFactory,
  RequestContextModuleAsyncOptions,
} from './interfaces';

// Types
export type {
  PathsOf,
  DeepValue,
  SafePath,
  LeafPathsOf,
  TypedGetter,
  KeysAtDepth,
  UnifiedRequest,
  UnifiedResponse,
  BaseContextStore,
  ContextStore,
  RequestWithUser,
  CommonRequestProperties,
} from './types';

export { isExpressRequest, isFastifyRequest } from './types';

// Constants
export {
  REQUEST_CONTEXT_MODULE_OPTIONS,
  REQUEST_CONTEXT_SERVICE,
  REQUEST_ADAPTER,
} from './constants';
