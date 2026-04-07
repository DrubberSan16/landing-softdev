import { Injectable, NotFoundException } from '@nestjs/common';
import { hash } from 'bcryptjs';
import { Request } from 'express';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../common/database/database.service';
import { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';
import { buildSetClause } from '../../../common/utils/build-set-clause.util';
import { AuditService } from '../audit/audit.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UpdateUserRolesDto,
} from './dto/upsert-user.dto';
import { UserQueryDto } from './dto/user-query.dto';

@Injectable()
export class UsersService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: UserQueryDto) {
    const offset = (query.page - 1) * query.limit;
    const filters: string[] = ['au.deleted_at IS NULL'];
    const values: unknown[] = [];

    if (query.search) {
      values.push(`%${query.search}%`);
      filters.push(
        `(au.full_name ILIKE $${values.length} OR au.email::varchar ILIKE $${values.length})`,
      );
    }

    if (query.status) {
      values.push(query.status);
      filters.push(`au.status = $${values.length}`);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const [items, totalRow] = await Promise.all([
      this.databaseService.query(
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
            au.must_change_password AS "mustChangePassword",
            au.failed_login_attempts AS "failedLoginAttempts",
            au.locked_until AS "lockedUntil",
            au.last_login_at AS "lastLoginAt",
            au.status,
            au.created_at AS "createdAt",
            au.updated_at AS "updatedAt",
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
            ) AS roles
          FROM landing_core.tb_admin_users au
          LEFT JOIN landing_core.tb_admin_user_roles aur
            ON aur.admin_user_id = au.id
          LEFT JOIN landing_core.tb_roles r
            ON r.id = aur.role_id
          ${whereClause}
          GROUP BY au.id
          ORDER BY au.created_at DESC
          LIMIT $${values.length + 1}
          OFFSET $${values.length + 2}
        `,
        [...values, query.limit, offset],
      ),
      this.databaseService.one<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM landing_core.tb_admin_users au
          ${whereClause}
        `,
        values,
      ),
    ]);

    return {
      items,
      meta: {
        page: query.page,
        limit: query.limit,
        total: Number(totalRow?.total ?? 0),
      },
    };
  }

  async findOne(publicId: string) {
    const user = await this.databaseService.one(
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
          au.must_change_password AS "mustChangePassword",
          au.failed_login_attempts AS "failedLoginAttempts",
          au.locked_until AS "lockedUntil",
          au.last_login_at AS "lastLoginAt",
          au.status,
          au.created_at AS "createdAt",
          au.updated_at AS "updatedAt",
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
          ) AS roles
        FROM landing_core.tb_admin_users au
        LEFT JOIN landing_core.tb_admin_user_roles aur
          ON aur.admin_user_id = au.id
        LEFT JOIN landing_core.tb_roles r
          ON r.id = aur.role_id
        WHERE au.public_id = $1::uuid
          AND au.deleted_at IS NULL
        GROUP BY au.id
      `,
      [publicId],
    );

    if (!user) {
      throw new NotFoundException('No se encontro el usuario administrativo.');
    }

    return user;
  }

  async create(payload: CreateUserDto, admin: CurrentAdmin, request: Request) {
    return this.createUser(payload, admin, request, 'admin_users.create');
  }

  async createInternal(payload: CreateUserDto, request: Request) {
    return this.createUser(
      payload,
      null,
      request,
      'admin_users.create.internal',
    );
  }

  async update(
    publicId: string,
    payload: UpdateUserDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    return this.updateUser(
      publicId,
      payload,
      admin,
      request,
      'admin_users.update',
    );
  }

  async updateInternal(
    publicId: string,
    payload: UpdateUserDto,
    request: Request,
  ) {
    return this.updateUser(
      publicId,
      payload,
      null,
      request,
      'admin_users.update.internal',
    );
  }

  async updateRoles(
    publicId: string,
    payload: UpdateUserRolesDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const existing = await this.databaseService.one<{
      id: number;
      fullName: string;
    }>(
      `
        SELECT id, full_name AS "fullName"
        FROM landing_core.tb_admin_users
        WHERE public_id = $1::uuid
          AND deleted_at IS NULL
      `,
      [publicId],
    );

    if (!existing) {
      throw new NotFoundException('No se encontro el usuario administrativo.');
    }

    await this.databaseService.transaction(async (client) => {
      await this.replaceUserRoles(existing.id, payload.roleCodes, client);
    });

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'admin_users.roles.update',
      entityName: 'tb_admin_user_roles',
      entityId: existing.id,
      description: `Roles actualizados para ${existing.fullName}`,
      newData: {
        roleCodes: payload.roleCodes,
      },
      request,
    });

    return this.findOne(publicId);
  }

  private async createUser(
    payload: CreateUserDto,
    admin: CurrentAdmin | null,
    request: Request,
    actionCode: string,
  ) {
    return this.databaseService.transaction(async (client) => {
      const passwordHash = await hash(payload.password, 10);
      const fullName = `${payload.firstName} ${payload.lastName}`.trim();

      const created = await this.databaseService.one<{
        id: number;
        publicId: string;
      }>(
        `
          INSERT INTO landing_core.tb_admin_users (
            first_name,
            last_name,
            full_name,
            email,
            phone,
            password_hash,
            avatar_url,
            must_change_password,
            status,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, FALSE), COALESCE($9, 'active'), NOW(), NOW())
          RETURNING id, public_id AS "publicId"
        `,
        [
          payload.firstName,
          payload.lastName,
          fullName,
          payload.email,
          payload.phone ?? null,
          passwordHash,
          payload.avatarUrl ?? null,
          payload.mustChangePassword ?? false,
          payload.status ?? 'active',
        ],
        client,
      );

      if (payload.roleCodes?.length) {
        await this.replaceUserRoles(created!.id, payload.roleCodes, client);
      }

      await this.auditService.log({
        adminUserId: admin?.id ?? null,
        actionCode,
        entityName: 'tb_admin_users',
        entityId: created?.id ?? null,
        description: `Usuario administrativo creado: ${fullName}`,
        newData: {
          publicId: created?.publicId ?? null,
          email: payload.email,
          roleCodes: payload.roleCodes ?? [],
        },
        request,
      });

      return this.findOne(created!.publicId);
    });
  }

  private async updateUser(
    publicId: string,
    payload: UpdateUserDto,
    admin: CurrentAdmin | null,
    request: Request,
    actionCode: string,
  ) {
    const existing = await this.databaseService.one<{
      id: number;
      firstName: string;
      lastName: string;
      fullName: string;
      email: string;
    }>(
      `
        SELECT
          id,
          first_name AS "firstName",
          last_name AS "lastName",
          full_name AS "fullName",
          email::varchar AS email
        FROM landing_core.tb_admin_users
        WHERE public_id = $1::uuid
          AND deleted_at IS NULL
      `,
      [publicId],
    );

    if (!existing) {
      throw new NotFoundException('No se encontro el usuario administrativo.');
    }

    return this.databaseService.transaction(async (client) => {
      const hashedPassword = payload.password
        ? await hash(payload.password, 10)
        : undefined;
      const fullName =
        payload.firstName || payload.lastName
          ? `${payload.firstName ?? existing.firstName} ${payload.lastName ?? existing.lastName}`.trim()
          : undefined;

      const updateData = buildSetClause(
        {
          first_name: payload.firstName,
          last_name: payload.lastName,
          full_name: fullName,
          email: payload.email,
          phone: payload.phone,
          password_hash: hashedPassword,
          avatar_url: payload.avatarUrl,
          must_change_password: payload.mustChangePassword,
          status: payload.status,
          updated_at: new Date(),
        },
        1,
      );

      await this.databaseService.one(
        `
          UPDATE landing_core.tb_admin_users
          SET ${updateData.setClause}
          WHERE public_id = $${updateData.values.length + 1}::uuid
          RETURNING id
        `,
        [...updateData.values, publicId],
        client,
      );

      if (payload.roleCodes) {
        await this.replaceUserRoles(existing.id, payload.roleCodes, client);
      }

      await this.auditService.log({
        adminUserId: admin?.id ?? null,
        actionCode,
        entityName: 'tb_admin_users',
        entityId: existing.id,
        description: `Usuario administrativo actualizado: ${existing.fullName}`,
        oldData: existing as Record<string, unknown>,
        newData: {
          email: payload.email ?? existing.email,
          roleCodes: payload.roleCodes,
        },
        request,
      });

      return this.findOne(publicId);
    });
  }

  private async replaceUserRoles(
    userId: number,
    roleCodes: string[],
    client: PoolClient,
  ) {
    await this.databaseService.query(
      `
        DELETE FROM landing_core.tb_admin_user_roles
        WHERE admin_user_id = $1
      `,
      [userId],
      client,
    );

    if (roleCodes.length === 0) {
      return;
    }

    const roles = await this.databaseService.query<{
      id: number;
      code: string;
    }>(
      `
        SELECT id, code
        FROM landing_core.tb_roles
        WHERE code = ANY($1::varchar[])
      `,
      [roleCodes],
      client,
    );

    if (roles.length !== roleCodes.length) {
      throw new NotFoundException('Uno o mas roles enviados no existen.');
    }

    await Promise.all(
      roles.map((role) =>
        this.databaseService.query(
          `
            INSERT INTO landing_core.tb_admin_user_roles (admin_user_id, role_id, created_at)
            VALUES ($1, $2, NOW())
          `,
          [userId, role.id],
          client,
        ),
      ),
    );
  }
}
