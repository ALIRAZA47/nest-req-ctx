import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RequestContextModule, RequestContextService } from '../../../src';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserMiddleware } from './user.middleware';

@Module({
  imports: [
    // Register the RequestContextModule for Fastify
    RequestContextModule.forRoot({
      isGlobal: true,
      adapter: 'fastify', // Explicitly set Fastify adapter
      setupType: 'middleware',
      setup: (ctx: RequestContextService, req: any) => {
        // Set a request ID if provided in headers
        const requestId = req.headers['x-request-id'] || `req-${Date.now()}`;
        ctx.set('requestId', requestId);
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply user middleware to simulate authentication
    consumer.apply(UserMiddleware).forRoutes('*');
  }
}
