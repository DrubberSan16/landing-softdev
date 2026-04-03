import { Request } from 'express';

export function getRequestIp(request: Request): string | null {
  const forwardedFor = request.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
    return forwardedFor.split(',')[0]?.trim() ?? null;
  }

  return request.ip ?? null;
}

export function getRequestUserAgent(request: Request): string | null {
  return request.headers['user-agent'] ?? null;
}
