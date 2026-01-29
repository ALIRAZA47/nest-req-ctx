import { Injectable } from '@nestjs/common';
import { RequestContextService, InjectContext } from '../../../src';
import { User } from './user.middleware';

/**
 * Context store interface
 */
interface AppContextStore {
  user?: User;
  requestId?: string;
}

@Injectable()
export class AppService {
  constructor(
    @InjectContext() private readonly ctx: RequestContextService<AppContextStore>,
  ) {}

  /**
   * Get information from the context
   */
  getContextInfo() {
    const user = this.ctx.get('user');
    const requestId = this.ctx.get('requestId');

    return {
      isActive: this.ctx.isActive(),
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      requestId,
      // Access nested values
      userFirstName: this.ctx.getByPath<string>('user.profile.firstName'),
      userRoles: this.ctx.getByPath<string[]>('user.roles'),
    };
  }

  /**
   * Get a header from the context
   */
  getHeader(key: string): string | string[] | undefined {
    return this.ctx.getHeader(key);
  }

  /**
   * Get all headers
   */
  getHeaders(): Record<string, string | string[] | undefined> {
    return this.ctx.getHeaders();
  }
}
