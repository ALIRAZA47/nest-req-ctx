import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestContextModule, RequestContextService, ExpressContextMiddleware } from '../../../src';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserMiddleware } from './user.middleware';
import { AppRequestContext } from './app-context.service';

@Module({
  imports: [
    // Register the RequestContextModule globally
    RequestContextModule.forRoot({
      isGlobal: true,
      adapter: 'express',
      setupType: 'middleware',
      // Optional: Custom setup function
      setup: (ctx: RequestContextService, req: any) => {
        // Set a request ID if provided in headers
        const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;
        ctx.set('requestId', requestId);
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService, AppRequestContext],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // IMPORTANT: Apply RequestContext middleware FIRST to initialize context
    // Then apply user middleware which depends on the context
    consumer
      .apply(ExpressContextMiddleware, UserMiddleware)
      .forRoutes('*');
  }
}
