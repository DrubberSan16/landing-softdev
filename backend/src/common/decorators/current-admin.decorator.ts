import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentAdmin } from '../interfaces/current-admin.interface';

export const CurrentAdminUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentAdmin | undefined => {
    const request = ctx
      .switchToHttp()
      .getRequest<Request & { admin?: CurrentAdmin }>();
    return request.admin;
  },
);
