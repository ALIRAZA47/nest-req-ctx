import { Injectable } from '@nestjs/common';
import { RequestContextService, InjectContext } from '../../../src';
import { User, AppContextStore } from './app-context.service';

@Injectable()
export class AppService {
  constructor(
    @InjectContext() private readonly ctx: RequestContextService<AppContextStore>,
  ) {}

  /**
   * Get information from the context
   */
  getContextInfo() {
    const user = this.ctx.get('user') as User | undefined;
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

  /**
   * Set a custom value in the context
   */
  setContextValue(key: string, value: any): void {
    this.ctx.set(key, value);
  }

  /**
   * Get a custom value from the context
   */
  getContextValue<T>(key: string): T | undefined {
    return this.ctx.get<T>(key);
  }
}
