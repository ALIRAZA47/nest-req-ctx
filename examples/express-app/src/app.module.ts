import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestContextModule, RequestContextService } from '../../../src';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserMiddleware } from './user.middleware';
import { AppRequestContext } from './app-context.service';

@Module({
  imports: [
    // Register the RequestContextModule globally
    // Middleware and guard are automatically configured - no manual setup needed!
    RequestContextModule.forRoot({
      isGlobal: true,
      adapter: 'express',
      setupType: 'middleware', // Middleware initializes context, guard acts as safety net
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
    // Only need to apply user middleware - RequestContext middleware is auto-configured
    consumer.apply(UserMiddleware).forRoutes('*');
  }
}
