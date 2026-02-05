# @kitstack/nest-req-ctx

A type-safe request context management package for NestJS using AsyncLocalStorage. Supports both Express and Fastify adapters.

## Features

- **Request Context Storage** - Store and access request-scoped data anywhere in your application
- **Type-Safe** - Full TypeScript support with generics and type inference
- **Express & Fastify Support** - Works with both HTTP adapters out of the box
- **Powerful Decorators** - Access request data, headers, and context values via decorators
- **Dot Notation Support** - Access deeply nested properties with dot notation (e.g., `user.profile.email`)
- **Extensible** - Create custom context services by extending the base class
- **Multiple Setup Methods** - Initialize context via middleware, guard, or interceptor

## Installation

```bash
npm install @kitstack/nest-req-ctx
```

## Quick Start

### 1. Import the Module

```typescript
// app.module.ts
import { Module } from "@nestjs/common";
import { RequestContextModule } from "@kitstack/nest-req-ctx";

@Module({
  imports: [
    RequestContextModule.forRoot({
      isGlobal: true, // Makes the module available everywhere
      adapter: "auto", // Auto-detect Express or Fastify
    }),
  ],
})
export class AppModule {}
```

### 2. Use Decorators in Controllers

```typescript
import { Controller, Get } from "@nestjs/common";
import { Req, Header, RequestKey, ContextValue } from "@kitstack/nest-req-ctx";
import { Request } from "express";

@Controller()
export class AppController {
  @Get()
  handler(
    @Req() request: Request,
    @Header("authorization") auth: string,
    @RequestKey("user") user: User,
    @RequestKey<string>("user.email") email: string,
    @ContextValue<string>("tenantId") tenantId: string,
  ) {
    return { user, email, tenantId };
  }
}
```

### 3. Inject Context Service

```typescript
import { Injectable } from "@nestjs/common";
import { RequestContextService, InjectContext } from "@kitstack/nest-req-ctx";

@Injectable()
export class AppService {
  constructor(@InjectContext() private readonly ctx: RequestContextService) {}

  getCurrentUser() {
    return this.ctx.get("user");
  }

  getUserEmail() {
    return this.ctx.getByPath<string>("user.email");
  }
}
```

## Module Configuration

### Basic Configuration

```typescript
RequestContextModule.forRoot({
  isGlobal: true, // Register globally (default: true)
  adapter: "express", // 'express' | 'fastify' | 'auto'
  setupType: "middleware", // 'middleware' | 'guard' | 'interceptor'
  setRequest: true, // Store request object in context
  exclude: ["/health"], // Routes to exclude (middleware only)
  setup: (ctx, req) => {
    // Custom setup function
    ctx.set("requestId", req.headers["x-request-id"]);
  },
});
```

### Async Configuration

```typescript
RequestContextModule.forRootAsync({
  imports: [ConfigModule],
  useFactory: (config: ConfigService) => ({
    adapter: config.get("HTTP_ADAPTER"),
  }),
  inject: [ConfigService],
});
```

## Decorators

### @Req()

Get the full request object:

```typescript
@Get()
handler(@Req() request: Request) {
  return { path: request.path };
}
```

### @Headers() / @Header()

Get all headers or a specific header:

```typescript
@Get()
handler(
  @Headers() allHeaders: Record<string, string>,
  @Header('authorization') auth: string,
  @Header('x-request-id') requestId: string,
) {
  return { auth, requestId };
}
```

### @RequestKey()

Get a value from the request object. Supports dot notation:

```typescript
@Get()
handler(
  @RequestKey('user') user: User,
  @RequestKey('user.email') email: string,
  @RequestKey<string>('user.profile.name') name: string,
) {
  return { user, email, name };
}
```

### @ContextValue()

Get a value from the context store. Supports dot notation and generics:

```typescript
@Get()
handler(
  @ContextValue('user') user: User,
  @ContextValue<string>('user.email') email: string,
  @ContextValue<string>('tenant.id') tenantId: string,
) {
  return { user, email, tenantId };
}
```

### @InjectContext()

Inject the RequestContextService:

```typescript
@Injectable()
export class MyService {
  constructor(@InjectContext() private ctx: RequestContextService) {}
}
```

## RequestContextService API

### Core Methods

```typescript
// Set a value
ctx.set("key", value);

// Get a value
const value = ctx.get("key");
const typedValue = ctx.get<User>("user");

// Get value by path (dot notation)
const email = ctx.getByPath<string>("user.profile.email");

// Check if key exists
const hasUser = ctx.has("user");

// Delete a key
ctx.delete("key");

// Get all values
const store = ctx.getAll();

// Check if context is active
const isActive = ctx.isActive();
```

### Request Methods

```typescript
// Get the request object
const request = ctx.getRequest();

// Get a header
const auth = ctx.getHeader("authorization");

// Get all headers
const headers = ctx.getHeaders();

// Get a request property (supports dot notation)
const user = ctx.getRequestProperty<User>("user");
const email = ctx.getRequestProperty<string>("user.email");
```

## Extending the Context

Create a custom context service for domain-specific functionality:

```typescript
import { Injectable } from "@nestjs/common";
import {
  BaseRequestContext,
  RequestContextService,
  InjectContext,
} from "@kitstack/nest-req-ctx";

interface AppContextStore {
  user: User;
  tenant: Tenant;
  requestId: string;
}

@Injectable()
export class AppRequestContext extends BaseRequestContext<AppContextStore> {
  constructor(@InjectContext() ctx: RequestContextService<AppContextStore>) {
    super(ctx);
  }

  get currentUser(): User | undefined {
    return this.get("user");
  }

  set currentUser(user: User) {
    this.set("user", user);
  }

  get currentTenant(): Tenant | undefined {
    return this.get("tenant");
  }

  hasRole(role: string): boolean {
    return this.currentUser?.roles.includes(role) ?? false;
  }

  isAdmin(): boolean {
    return this.hasRole("admin");
  }
}
```

Use it in your application:

```typescript
@Controller()
export class AppController {
  constructor(private readonly appContext: AppRequestContext) {}

  @Get()
  handler() {
    return {
      isAuthenticated: this.appContext.isActive,
      isAdmin: this.appContext.isAdmin(),
      user: this.appContext.currentUser,
    };
  }
}
```

## Using with Fastify

```typescript
// main.ts
import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.listen(3000);
}

// app.module.ts
@Module({
  imports: [
    RequestContextModule.forRoot({
      adapter: "fastify",
    }),
  ],
})
export class AppModule {}
```

## TypeScript Utilities

### Type-Safe Path Access

```typescript
import { PathsOf, DeepValue } from "@kitstack/nest-req-ctx";

interface MyStore {
  user: {
    id: string;
    profile: {
      email: string;
      name: string;
    };
  };
}

// PathsOf generates all valid paths
type Paths = PathsOf<MyStore>;
// 'user' | 'user.id' | 'user.profile' | 'user.profile.email' | 'user.profile.name'

// DeepValue gets the type at a path
type Email = DeepValue<MyStore, "user.profile.email">; // string
```

### Typed Decorator Factories

```typescript
import { createTypedContextValue } from "@kitstack/nest-req-ctx";

interface MyStore {
  user: { email: string };
  tenant: { id: string };
}

const TypedContext = createTypedContextValue<MyStore>();

@Controller()
export class AppController {
  @Get()
  handler(
    @TypedContext("user.email") email: string,
    @TypedContext("tenant.id") tenantId: string,
  ) {
    return { email, tenantId };
  }
}
```

## Setting Context Values

### Via Middleware

```typescript
@Injectable()
export class AuthMiddleware implements NestMiddleware {
  constructor(private ctx: RequestContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const user = this.validateToken(req.headers.authorization);
    this.ctx.set("user", user);
    next();
  }
}
```

### Via Guard

```typescript
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private ctx: RequestContextService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = this.validateToken(request.headers.authorization);
    this.ctx.set("user", user);
    return !!user;
  }
}
```

### Via Module Setup

```typescript
RequestContextModule.forRoot({
  setup: (ctx, req) => {
    ctx.set("requestId", req.headers["x-request-id"] || uuid());
    ctx.set("correlationId", req.headers["x-correlation-id"]);
  },
});
```

## API Reference

### Exports

| Export                  | Type      | Description                           |
| ----------------------- | --------- | ------------------------------------- |
| `RequestContextModule`  | Module    | Main module with forRoot/forRootAsync |
| `RequestContextService` | Service   | Core context service                  |
| `BaseRequestContext`    | Class     | Base class for custom contexts        |
| `@Req()`                | Decorator | Get request object                    |
| `@Headers()`            | Decorator | Get all headers                       |
| `@Header(key)`          | Decorator | Get specific header                   |
| `@RequestKey(key)`      | Decorator | Get request property                  |
| `@ContextValue(key)`    | Decorator | Get context value                     |
| `@InjectContext()`      | Decorator | Inject context service                |

### Type Exports

| Export                        | Description                      |
| ----------------------------- | -------------------------------- |
| `PathsOf<T>`                  | All dot-notation paths of type T |
| `DeepValue<T, P>`             | Value type at path P in type T   |
| `UnifiedRequest`              | Express or Fastify request type  |
| `RequestContextModuleOptions` | Module configuration options     |
| `AdapterType`                 | 'express' \| 'fastify' \| 'auto' |

## License

MIT
