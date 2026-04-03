import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { compare } from 'bcryptjs';
import { Request } from 'express';
import { DatabaseService } from '../../../common/database/database.service';
import { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';
import {
  getRequestIp,
  getRequestUserAgent,
} from '../../../common/utils/request-context.util';
import {
  generateSessionToken,
  hashSessionToken,
} from '../../../common/utils/token.util';
import { AuditService } from '../audit/audit.service';
import { LoginDto } from './dto/login.dto';

type AdminProfileRow = {
  id: number;
  publicId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  status: string;
  mustChangePassword: boolean;
  failedLoginAttempts: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  passwordHash?: string;
  roles: CurrentAdmin['roles'];
  permissions: string[];
};

type SessionLookupRow = AdminProfileRow & {
  sessionId: number;
  expiresAt: string | null;
  revokedAt: string | null;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {}

  async login(payload: LoginDto, request: Request) {
    const admin = await this.findAdminByEmail(payload.email, true);

    if (!admin) {
      throw new UnauthorizedException('Credenciales invalidas.');
    }

    if (admin.status !== 'active') {
      throw new ForbiddenException('El usuario administrativo no esta activo.');
    }

    if (
      admin.lockedUntil &&
      new Date(admin.lockedUntil).getTime() > Date.now()
    ) {
      throw new ForbiddenException(
        'La cuenta se encuentra bloqueada temporalmente.',
      );
    }

    const passwordMatches =
      !!admin.passwordHash &&
      admin.passwordHash.startsWith('$2') &&
      (await compare(payload.password, admin.passwordHash));

    if (!passwordMatches) {
      await this.registerFailedAttempt(admin.id);
      throw new UnauthorizedException('Credenciales invalidas.');
    }

    await this.resetFailedAttempts(admin.id);

    const sessionToken = generateSessionToken();
    const sessionTokenHash = hashSessionToken(sessionToken);
    const sessionTtlHours = Number(
      this.configService.get<string>('AUTH_SESSION_TTL_HOURS', '12'),
    );

    const session = await this.databaseService.one<{
      id: number;
      expiresAt: string;
    }>(
      `
        INSERT INTO landing_core.tb_admin_auth_sessions (
          admin_user_id,
          refresh_token_hash,
          ip_address,
          user_agent,
          started_at,
          last_activity_at,
          expires_at
        )
        VALUES (
          $1,
          $2,
          $3::inet,
          $4,
          NOW(),
          NOW(),
          NOW() + make_interval(hours => $5)
        )
        RETURNING id, expires_at AS "expiresAt"
      `,
      [
        admin.id,
        sessionTokenHash,
        getRequestIp(request),
        getRequestUserAgent(request),
        sessionTtlHours,
      ],
    );

    await this.databaseService.query(
      `
        UPDATE landing_core.tb_admin_users
        SET
          failed_login_attempts = 0,
          locked_until = NULL,
          last_login_at = NOW()
        WHERE id = $1
      `,
      [admin.id],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'auth.login',
      entityName: 'tb_admin_auth_sessions',
      entityId: session?.id ?? null,
      description: 'Inicio de sesion administrativo',
      newData: {
        sessionId: session?.id ?? null,
      },
      request,
    });

    const profile = await this.findAdminById(admin.id);

    if (!profile) {
      throw new NotFoundException(
        'No se pudo cargar el perfil administrativo.',
      );
    }

    return {
      token: sessionToken,
      expiresAt: session?.expiresAt ?? null,
      admin: profile,
    };
  }

  async getCurrentAdminProfile(sessionToken: string): Promise<CurrentAdmin> {
    const session = await this.getSessionByToken(sessionToken);

    if (!session) {
      throw new UnauthorizedException(
        'Sesion administrativa invalida o expirada.',
      );
    }

    await this.databaseService.query(
      `
        UPDATE landing_core.tb_admin_auth_sessions
        SET last_activity_at = NOW()
        WHERE id = $1
      `,
      [session.sessionId],
    );

    return {
      id: session.id,
      publicId: session.publicId,
      email: session.email,
      fullName: session.fullName,
      firstName: session.firstName,
      lastName: session.lastName,
      status: session.status,
      mustChangePassword: session.mustChangePassword,
      sessionId: session.sessionId,
      roles: session.roles,
      permissions: session.permissions,
    };
  }

  async logout(
    sessionToken: string,
    request: Request,
  ): Promise<{ success: boolean }> {
    const session = await this.getSessionByToken(sessionToken);

    if (!session) {
      throw new UnauthorizedException(
        'Sesion administrativa invalida o expirada.',
      );
    }

    await this.databaseService.query(
      `
        UPDATE landing_core.tb_admin_auth_sessions
        SET revoked_at = NOW(), revoke_reason = 'logout'
        WHERE id = $1
      `,
      [session.sessionId],
    );

    await this.auditService.log({
      adminUserId: session.id,
      actionCode: 'auth.logout',
      entityName: 'tb_admin_auth_sessions',
      entityId: session.sessionId,
      description: 'Cierre de sesion administrativo',
      request,
    });

    return { success: true };
  }

  async resolveSessionToken(sessionToken: string): Promise<CurrentAdmin> {
    return this.getCurrentAdminProfile(sessionToken);
  }

  private async findAdminByEmail(
    email: string,
    includePasswordHash = false,
  ): Promise<AdminProfileRow | null> {
    return this.databaseService.one<AdminProfileRow>(
      this.baseAdminProfileQuery(includePasswordHash) +
        `
          WHERE au.deleted_at IS NULL
            AND au.email = $1
          GROUP BY au.id
        `,
      [email],
    );
  }

  private async findAdminById(id: number): Promise<AdminProfileRow | null> {
    return this.databaseService.one<AdminProfileRow>(
      this.baseAdminProfileQuery(false) +
        `
          WHERE au.deleted_at IS NULL
            AND au.id = $1
          GROUP BY au.id
        `,
      [id],
    );
  }

  private async getSessionByToken(
    sessionToken: string,
  ): Promise<SessionLookupRow | null> {
    return this.databaseService.one<SessionLookupRow>(
      `
        SELECT
          au.id,
          au.public_id AS "publicId",
          au.first_name AS "firstName",
          au.last_name AS "lastName",
          au.full_name AS "fullName",
          au.email::varchar AS email,
          au.phone,
          au.avatar_url AS "avatarUrl",
          au.status,
          au.must_change_password AS "mustChangePassword",
          au.failed_login_attempts AS "failedLoginAttempts",
          au.locked_until AS "lockedUntil",
          au.last_login_at AS "lastLoginAt",
          s.id AS "sessionId",
          s.expires_at AS "expiresAt",
          s.revoked_at AS "revokedAt",
          COALESCE(
            jsonb_agg(
              DISTINCT jsonb_build_object(
                'id', r.id,
                'code', r.code,
                'name', r.name,
                'description', r.description
              )
            ) FILTER (WHERE r.id IS NOT NULL),
            '[]'::jsonb
          ) AS roles,
          COALESCE(array_remove(array_agg(DISTINCT p.code), NULL), ARRAY[]::varchar[]) AS permissions
        FROM landing_core.tb_admin_auth_sessions s
        JOIN landing_core.tb_admin_users au
          ON au.id = s.admin_user_id
        LEFT JOIN landing_core.tb_admin_user_roles aur
          ON aur.admin_user_id = au.id
        LEFT JOIN landing_core.tb_roles r
          ON r.id = aur.role_id
         AND r.status = TRUE
        LEFT JOIN landing_core.tb_role_permissions rp
          ON rp.role_id = r.id
        LEFT JOIN landing_core.tb_permissions p
          ON p.id = rp.permission_id
        WHERE s.refresh_token_hash = $1
          AND s.revoked_at IS NULL
          AND (s.expires_at IS NULL OR s.expires_at > NOW())
          AND au.deleted_at IS NULL
          AND au.status = 'active'
        GROUP BY au.id, s.id
      `,
      [hashSessionToken(sessionToken)],
    );
  }

  private baseAdminProfileQuery(includePasswordHash: boolean): string {
    return `
      SELECT
        au.id,
        au.public_id AS "publicId",
        au.first_name AS "firstName",
        au.last_name AS "lastName",
        au.full_name AS "fullName",
        au.email::varchar AS email,
        au.phone,
        au.avatar_url AS "avatarUrl",
        au.status,
        au.must_change_password AS "mustChangePassword",
        au.failed_login_attempts AS "failedLoginAttempts",
        au.locked_until AS "lockedUntil",
        au.last_login_at AS "lastLoginAt",
        ${includePasswordHash ? 'au.password_hash AS "passwordHash",' : ''}
        COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', r.id,
              'code', r.code,
              'name', r.name,
              'description', r.description
            )
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'::jsonb
        ) AS roles,
        COALESCE(array_remove(array_agg(DISTINCT p.code), NULL), ARRAY[]::varchar[]) AS permissions
      FROM landing_core.tb_admin_users au
      LEFT JOIN landing_core.tb_admin_user_roles aur
        ON aur.admin_user_id = au.id
      LEFT JOIN landing_core.tb_roles r
        ON r.id = aur.role_id
       AND r.status = TRUE
      LEFT JOIN landing_core.tb_role_permissions rp
        ON rp.role_id = r.id
      LEFT JOIN landing_core.tb_permissions p
        ON p.id = rp.permission_id
    `;
  }

  private async registerFailedAttempt(adminUserId: number): Promise<void> {
    const maxAttempts = Number(
      this.configService.get<string>('AUTH_MAX_FAILED_ATTEMPTS', '5'),
    );
    const lockMinutes = Number(
      this.configService.get<string>('AUTH_LOCK_MINUTES', '15'),
    );

    await this.databaseService.query(
      `
        UPDATE landing_core.tb_admin_users
        SET
          failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE
            WHEN failed_login_attempts + 1 >= $2
              THEN NOW() + make_interval(mins => $3)
            ELSE locked_until
          END
        WHERE id = $1
      `,
      [adminUserId, maxAttempts, lockMinutes],
    );
  }

  private async resetFailedAttempts(adminUserId: number): Promise<void> {
    await this.databaseService.query(
      `
        UPDATE landing_core.tb_admin_users
        SET failed_login_attempts = 0, locked_until = NULL
        WHERE id = $1
      `,
      [adminUserId],
    );
  }
}
