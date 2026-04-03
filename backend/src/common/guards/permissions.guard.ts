import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { CurrentAdmin } from '../interfaces/current-admin.interface';
import type { Request } from 'express';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<Request & { admin?: CurrentAdmin }>();
    const admin = request.admin;

    if (!admin) {
      throw new ForbiddenException('No hay una sesion administrativa activa.');
    }

    const allowed = requiredPermissions.every((permission) =>
      admin.permissions.includes(permission),
    );

    if (!allowed) {
      throw new ForbiddenException(
        'No tienes permisos para realizar esta accion.',
      );
    }

    return true;
  }
}
