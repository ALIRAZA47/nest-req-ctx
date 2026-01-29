/**
 * Injection token for the RequestContextModuleOptions
 * Used internally for dependency injection of module configuration
 */
export const REQUEST_CONTEXT_MODULE_OPTIONS = Symbol('REQUEST_CONTEXT_MODULE_OPTIONS');

/**
 * Injection token for the RequestContextService
 * Can be used as an alternative to direct class injection
 *
 * @example
 * ```typescript
 * constructor(
 *   @Inject(REQUEST_CONTEXT_SERVICE)
 *   private ctx: RequestContextService
 * ) {}
 * ```
 */
export const REQUEST_CONTEXT_SERVICE = Symbol('REQUEST_CONTEXT_SERVICE');

/**
 * Injection token for the RequestAdapter
 * Used to inject the adapter configured for the current application
 */
export const REQUEST_ADAPTER = Symbol('REQUEST_ADAPTER');
