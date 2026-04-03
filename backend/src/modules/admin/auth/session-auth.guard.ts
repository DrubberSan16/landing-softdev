import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { admin?: unknown }>();
    const header = request.headers.authorization;

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Debes enviar un bearer token valido.');
    }

    const token = header.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      throw new UnauthorizedException('Debes enviar un bearer token valido.');
    }

    request.admin = await this.authService.resolveSessionToken(token);
    return true;
  }
}
