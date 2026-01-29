import { Injectable, NestMiddleware } from '@nestjs/common';
import { FastifyRequest, FastifyReply } from 'fastify';
import { RequestContextService } from '../../../src';

/**
 * Example user interface
 */
export interface User {
  id: string;
  email: string;
  name: string;
  profile: {
    firstName: string;
    lastName: string;
    avatar: string;
  };
  roles: string[];
}

/**
 * Example middleware that simulates user authentication for Fastify
 * Sets user data on the request object and in the context
 */
@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(private readonly contextService: RequestContextService) {}

  use(req: FastifyRequest, _res: FastifyReply, next: (error?: any) => void) {
    // Simulate extracting user from JWT/session
    const userId = req.headers['x-user-id'] as string;

    if (userId) {
      const user: User = {
        id: userId,
        email: `user${userId}@example.com`,
        name: `User ${userId}`,
        profile: {
          firstName: 'Jane',
          lastName: 'Smith',
          avatar: 'https://example.com/avatar.jpg',
        },
        roles: ['user', 'moderator'],
      };

      // Set on request object (traditional approach)
      (req as any).user = user;

      // Also set in context (modern approach)
      this.contextService.set('user', user);
    }

    next();
  }
}
