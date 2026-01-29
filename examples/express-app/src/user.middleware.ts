import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../../../src';

/**
 * Example middleware that simulates user authentication
 * Sets user data on the request object and in the context
 */
@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    // Simulate extracting user from JWT/session
    const userId = req.headers['x-user-id'] as string;

    if (userId) {
      const user = {
        id: userId,
        email: `user${userId}@example.com`,
        name: `User ${userId}`,
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          avatar: 'https://example.com/avatar.jpg',
        },
        roles: ['user', 'admin'],
      };

      // Set on request object (traditional approach)
      (req as any).user = user;

      // Also set in context (modern approach)
      this.contextService.set('user', user);
    }

    next();
  }
}
