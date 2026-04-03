import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { DatabaseService } from '../../../common/database/database.service';
import {
  getRequestIp,
  getRequestUserAgent,
} from '../../../common/utils/request-context.util';
import { AuditQueryDto } from './dto/audit-query.dto';

@Injectable()
export class AuditService {
  constructor(private readonly databaseService: DatabaseService) {}

  async log(params: {
    adminUserId?: number | null;
    actionCode: string;
    entityName: string;
    entityId?: number | null;
    description?: string | null;
    oldData?: Record<string, unknown> | null;
    newData?: Record<string, unknown> | null;
    request?: Request;
  }): Promise<void> {
    await this.databaseService.query(
      `
        INSERT INTO landing_core.tb_admin_audit_logs (
          admin_user_id,
          action_code,
          entity_name,
          entity_id,
          description,
          old_data,
          new_data,
          ip_address,
          user_agent,
          created_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8::inet, $9, NOW())
      `,
      [
        params.adminUserId ?? null,
        params.actionCode,
        params.entityName,
        params.entityId ?? null,
        params.description ?? null,
        JSON.stringify(params.oldData ?? null),
        JSON.stringify(params.newData ?? null),
        params.request ? getRequestIp(params.request) : null,
        params.request ? getRequestUserAgent(params.request) : null,
      ],
    );
  }

  async list(query: AuditQueryDto) {
    const offset = (query.page - 1) * query.limit;
    const filters: string[] = [];
    const values: unknown[] = [];

    if (query.adminUserPublicId) {
      values.push(query.adminUserPublicId);
      filters.push(`au.public_id = $${values.length}::uuid`);
    }

    if (query.actionCode) {
      values.push(query.actionCode);
      filters.push(`al.action_code = $${values.length}`);
    }

    if (query.entityName) {
      values.push(query.entityName);
      filters.push(`al.entity_name = $${values.length}`);
    }

    const whereClause =
      filters.length > 0 ? `WHERE ${filters.join(' AND ')}` : '';

    const [items, totalRow] = await Promise.all([
      this.databaseService.query(
        `
          SELECT
            al.id,
            al.action_code AS "actionCode",
            al.entity_name AS "entityName",
            al.entity_id AS "entityId",
            al.description,
            al.old_data AS "oldData",
            al.new_data AS "newData",
            al.ip_address::text AS "ipAddress",
            al.user_agent AS "userAgent",
            al.created_at AS "createdAt",
            au.public_id AS "adminUserPublicId",
            au.full_name AS "adminUserFullName",
            au.email::varchar AS "adminUserEmail"
          FROM landing_core.tb_admin_audit_logs al
          LEFT JOIN landing_core.tb_admin_users au
            ON au.id = al.admin_user_id
          ${whereClause}
          ORDER BY al.created_at DESC, al.id DESC
          LIMIT $${values.length + 1}
          OFFSET $${values.length + 2}
        `,
        [...values, query.limit, offset],
      ),
      this.databaseService.one<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM landing_core.tb_admin_audit_logs al
          LEFT JOIN landing_core.tb_admin_users au
            ON au.id = al.admin_user_id
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
}
