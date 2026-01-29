import { Controller, Get } from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import {
  Req,
  Headers,
  Header,
  RequestKey,
  ContextValue,
} from '../../../src';
import { AppService } from './app.service';
import { User } from './user.middleware';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * Basic endpoint showing @Req decorator with Fastify
   * GET /
   */
  @Get()
  getHello(@Req() request: FastifyRequest) {
    return {
      message: 'Hello from Fastify!',
      url: request.url,
      method: request.method,
    };
  }

  /**
   * Endpoint showing @Headers decorator
   * GET /headers
   */
  @Get('headers')
  getHeaders(
    @Headers() headers: Record<string, string>,
    @Header('user-agent') userAgent: string,
    @Header('x-request-id') requestId: string,
  ) {
    return {
      allHeaders: headers,
      userAgent,
      requestId,
    };
  }

  /**
   * Endpoint showing @RequestKey decorator
   * GET /user
   * Set header: x-user-id: 123
   */
  @Get('user')
  getUser(
    @RequestKey('user') user: User,
    @RequestKey('user.email') email: string,
    @RequestKey('user.profile.firstName') firstName: string,
  ) {
    return {
      user,
      email,
      firstName,
    };
  }

  /**
   * Endpoint showing @ContextValue decorator
   * GET /context
   * Set header: x-user-id: 123
   */
  @Get('context')
  getContextValues(
    @ContextValue('user') user: User,
    @ContextValue<string>('user.email') email: string,
    @ContextValue<string>('requestId') requestId: string,
  ) {
    return {
      user,
      email,
      requestId,
    };
  }

  /**
   * Endpoint showing service injection
   * GET /service
   * Set header: x-user-id: 123
   */
  @Get('service')
  getFromService() {
    return this.appService.getContextInfo();
  }

  /**
   * Endpoint showing all features combined
   * GET /all
   * Set headers: x-user-id: 123, x-request-id: req-456
   */
  @Get('all')
  getAllFeatures(
    @Req() request: FastifyRequest,
    @Header('x-request-id') requestId: string,
    @RequestKey('user') requestUser: User,
    @ContextValue('user') contextUser: User,
  ) {
    return {
      // From decorator
      requestUrl: request.url,
      requestIdHeader: requestId,
      requestUser: requestUser?.email,
      contextUser: contextUser?.email,

      // From service
      serviceInfo: this.appService.getContextInfo(),
    };
  }
}
