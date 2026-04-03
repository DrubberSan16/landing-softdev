import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../common/database/database.service';

@Injectable()
export class RolesService {
  constructor(private readonly databaseService: DatabaseService) {}

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
}
