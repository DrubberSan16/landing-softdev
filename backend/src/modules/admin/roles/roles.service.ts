import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Request } from 'express';
import { PoolClient } from 'pg';
import { DatabaseService } from '../../../common/database/database.service';
import { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';
import { buildSetClause } from '../../../common/utils/build-set-clause.util';
import { AuditService } from '../audit/audit.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/upsert-role.dto';

@Injectable()
export class RolesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async listRoles() {
    return this.databaseService.query(
      `
        SELECT
          r.id,
          r.code,
          r.name,
          r.description,
          r.is_system AS "isSystem",
          r.status,
          COALESCE(
            jsonb_agg(
              DISTINCT jsonb_build_object(
                'id', p.id,
                'code', p.code,
                'moduleName', p.module_name,
                'actionName', p.action_name,
                'description', p.description
              )
            ) FILTER (WHERE p.id IS NOT NULL),
            '[]'::jsonb
          ) AS permissions
        FROM landing_core.tb_roles r
        LEFT JOIN landing_core.tb_role_permissions rp
          ON rp.role_id = r.id
        LEFT JOIN landing_core.tb_permissions p
          ON p.id = rp.permission_id
        GROUP BY r.id
        ORDER BY r.is_system DESC, r.name ASC
      `,
    );
  }

  async listPermissions() {
    return this.databaseService.query(
      `
        SELECT
          id,
          module_name AS "moduleName",
          action_name AS "actionName",
          code,
          description,
          created_at AS "createdAt"
        FROM landing_core.tb_permissions
        ORDER BY module_name ASC, action_name ASC
      `,
    );
  }

  async create(payload: CreateRoleDto, admin: CurrentAdmin, request: Request) {
    const normalizedCode = payload.code.trim().toUpperCase();

    const created = await this.databaseService.transaction(async (client) => {
      const role = await this.databaseService.one<{ id: number; code: string }>(
        `
          INSERT INTO landing_core.tb_roles (
            code, name, description, is_system, status, created_at, updated_at
          )
          VALUES ($1, $2, $3, FALSE, COALESCE($4, TRUE), NOW(), NOW())
          RETURNING id, code
        `,
        [
          normalizedCode,
          payload.name,
          payload.description ?? null,
          payload.status ?? true,
        ],
        client,
      );

      await this.syncPermissions(
        role!.id,
        payload.permissionCodes ?? [],
        client,
      );
      return role!;
    });

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'roles.create',
      entityName: 'tb_roles',
      entityId: created.id,
      description: `Rol creado: ${payload.name}`,
      newData: {
        code: created.code,
        permissionCodes: payload.permissionCodes ?? [],
      },
      request,
    });

    return this.findByCode(created.code);
  }

  async update(
    code: string,
    payload: UpdateRoleDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const existing = await this.getEditableRole(code);
    const nextCode = payload.code?.trim().toUpperCase();

    await this.databaseService.transaction(async (client) => {
      const updateData = buildSetClause(
        {
          code: nextCode,
          name: payload.name,
          description: payload.description,
          status: payload.status,
          updated_at: new Date(),
        },
        1,
      );

      await this.databaseService.query(
        `UPDATE landing_core.tb_roles SET ${updateData.setClause} WHERE id = $${updateData.values.length + 1}`,
        [...updateData.values, existing.id],
        client,
      );

      if (payload.permissionCodes) {
        await this.syncPermissions(
          existing.id,
          payload.permissionCodes,
          client,
        );
      }
    });

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'roles.update',
      entityName: 'tb_roles',
      entityId: existing.id,
      description: `Rol actualizado: ${existing.name}`,
      oldData: existing as Record<string, unknown>,
      newData: payload as Record<string, unknown>,
      request,
    });

    return this.findByCode(nextCode ?? existing.code);
  }

  async remove(code: string, admin: CurrentAdmin, request: Request) {
    const existing = await this.getEditableRole(code);
    const assignment = await this.databaseService.one<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM landing_core.tb_admin_user_roles WHERE role_id = $1`,
      [existing.id],
    );

    if (Number(assignment?.count ?? 0) > 0) {
      throw new ConflictException(
        'El rol esta asignado a usuarios. Retira esas asignaciones antes de eliminarlo.',
      );
    }

    await this.databaseService.query(
      `DELETE FROM landing_core.tb_roles WHERE id = $1`,
      [existing.id],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'roles.delete',
      entityName: 'tb_roles',
      entityId: existing.id,
      description: `Rol eliminado: ${existing.name}`,
      oldData: existing as Record<string, unknown>,
      request,
    });

    return { message: 'Rol eliminado correctamente.' };
  }

  private async findByCode(code: string) {
    const roles = (await this.listRoles()) as Array<{ code: string }>;
    const role = roles.find((item) => item.code === code);

    if (!role) {
      throw new NotFoundException('No se encontro el rol solicitado.');
    }

    return role;
  }

  private async getEditableRole(code: string) {
    const role = await this.databaseService.one<{
      id: number;
      code: string;
      name: string;
      isSystem: boolean;
      status: boolean;
    }>(
      `
        SELECT
          id,
          code,
          name,
          is_system AS "isSystem",
          status
        FROM landing_core.tb_roles
        WHERE code = $1
      `,
      [code],
    );

    if (!role) {
      throw new NotFoundException('No se encontro el rol solicitado.');
    }

    if (role.isSystem) {
      throw new BadRequestException(
        'Los roles base del sistema estan protegidos.',
      );
    }

    return role;
  }

  private async syncPermissions(
    roleId: number,
    permissionCodes: string[],
    client: PoolClient,
  ) {
    await this.databaseService.query(
      `DELETE FROM landing_core.tb_role_permissions WHERE role_id = $1`,
      [roleId],
      client,
    );

    if (permissionCodes.length === 0) {
      return;
    }

    const permissions = await this.databaseService.query<{
      id: number;
      code: string;
    }>(
      `SELECT id, code FROM landing_core.tb_permissions WHERE code = ANY($1::varchar[])`,
      [permissionCodes],
      client,
    );

    if (permissions.length !== permissionCodes.length) {
      throw new NotFoundException('Uno o mas permisos enviados no existen.');
    }

    await Promise.all(
      permissions.map((permission) =>
        this.databaseService.query(
          `INSERT INTO landing_core.tb_role_permissions (role_id, permission_id, created_at) VALUES ($1, $2, NOW())`,
          [roleId, permission.id],
          client,
        ),
      ),
    );
  }
}
