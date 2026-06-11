import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { CurrentAdmin } from '../interfaces/current-admin.interface';
import type { Request } from 'express';
import { AuthService } from '../../modules/admin/auth/auth.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
    const admin = request.admin ?? (await this.resolveAdmin(request));

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

  private async resolveAdmin(
    request: Request & { admin?: CurrentAdmin },
  ): Promise<CurrentAdmin> {
    const header = request.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Debes enviar un bearer token valido.');
    }

    const token = header.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      throw new UnauthorizedException('Debes enviar un bearer token valido.');
    }

    request.admin = await this.authService.resolveSessionToken(token);
    return request.admin;
  }
}
