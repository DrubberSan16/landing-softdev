import { Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { DatabaseService } from '../../../common/database/database.service';
import { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';
import { buildSetClause } from '../../../common/utils/build-set-clause.util';
import { AuditService } from '../audit/audit.service';
import { ContactQueryDto } from './dto/contact-query.dto';
import { UpdateContactDto } from './dto/update-contact.dto';

@Injectable()
export class ContactsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: ContactQueryDto) {
    const offset = (query.page - 1) * query.limit;
    const filters: string[] = ['1 = 1'];
    const values: unknown[] = [];

    if (query.search) {
      values.push(`%${query.search}%`);
      filters.push(
        `(cr.full_name ILIKE $${values.length} OR cr.email::varchar ILIKE $${values.length} OR cr.subject ILIKE $${values.length})`,
      );
    }

    if (query.status) {
      values.push(query.status);
      filters.push(`cr.status = $${values.length}`);
    }

    if (query.projectPublicId) {
      values.push(query.projectPublicId);
      filters.push(`p.public_id = $${values.length}::uuid`);
    }

    if (query.assignedToPublicId) {
      values.push(query.assignedToPublicId);
      filters.push(`assignee.public_id = $${values.length}::uuid`);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const [items, totalRow] = await Promise.all([
      this.databaseService.query(
        `
          SELECT
            cr.id,
            cr.public_id AS "publicId",
            cr.full_name AS "fullName",
            cr.company_name AS "companyName",
            cr.email::varchar AS email,
            cr.phone,
            cr.preferred_contact_method AS "preferredContactMethod",
            cr.subject,
            cr.message,
            cr.budget_range AS "budgetRange",
            cr.source_path AS "sourcePath",
            cr.source_page_url AS "sourcePageUrl",
            cr.status,
            cr.terms_accepted AS "termsAccepted",
            cr.wants_notifications AS "wantsNotifications",
            cr.first_response_at AS "firstResponseAt",
            cr.closed_at AS "closedAt",
            cr.admin_notes AS "adminNotes",
            cr.created_at AS "createdAt",
            cr.updated_at AS "updatedAt",
            p.public_id AS "projectPublicId",
            p.title AS "projectTitle",
            assignee.public_id AS "assignedToPublicId",
            assignee.full_name AS "assignedToFullName"
          FROM landing_core.tb_contact_requests cr
          LEFT JOIN landing_core.tb_projects p
            ON p.id = cr.project_id
          LEFT JOIN landing_core.tb_admin_users assignee
            ON assignee.id = cr.assigned_to
          ${whereClause}
          ORDER BY cr.created_at DESC, cr.id DESC
          LIMIT $${values.length + 1}
          OFFSET $${values.length + 2}
        `,
        [...values, query.limit, offset],
      ),
      this.databaseService.one<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM landing_core.tb_contact_requests cr
          LEFT JOIN landing_core.tb_projects p
            ON p.id = cr.project_id
          LEFT JOIN landing_core.tb_admin_users assignee
            ON assignee.id = cr.assigned_to
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
    const contact = await this.databaseService.one(
      `
        SELECT
          cr.id,
          cr.public_id AS "publicId",
          cr.full_name AS "fullName",
          cr.company_name AS "companyName",
          cr.email::varchar AS email,
          cr.phone,
          cr.preferred_contact_method AS "preferredContactMethod",
          cr.subject,
          cr.message,
          cr.budget_range AS "budgetRange",
          cr.source_path AS "sourcePath",
          cr.source_page_url AS "sourcePageUrl",
          cr.status,
          cr.terms_accepted AS "termsAccepted",
          cr.wants_notifications AS "wantsNotifications",
          cr.first_response_at AS "firstResponseAt",
          cr.closed_at AS "closedAt",
          cr.admin_notes AS "adminNotes",
          cr.created_at AS "createdAt",
          cr.updated_at AS "updatedAt",
          p.public_id AS "projectPublicId",
          p.title AS "projectTitle",
          assignee.public_id AS "assignedToPublicId",
          assignee.full_name AS "assignedToFullName"
        FROM landing_core.tb_contact_requests cr
        LEFT JOIN landing_core.tb_projects p
          ON p.id = cr.project_id
        LEFT JOIN landing_core.tb_admin_users assignee
          ON assignee.id = cr.assigned_to
        WHERE cr.public_id = $1::uuid
      `,
      [publicId],
    );

    if (!contact) {
      throw new NotFoundException('No se encontro el lead solicitado.');
    }

    return contact;
  }

  async update(
    publicId: string,
    payload: UpdateContactDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const existing = await this.databaseService.one<{
      id: number;
      status: string;
      adminNotes: string | null;
      assignedTo: number | null;
    }>(
      `
        SELECT
          id,
          status,
          admin_notes AS "adminNotes",
          assigned_to AS "assignedTo"
        FROM landing_core.tb_contact_requests
        WHERE public_id = $1::uuid
      `,
      [publicId],
    );

    if (!existing) {
      throw new NotFoundException('No se encontro el lead solicitado.');
    }

    let assignedToId: number | null | undefined = undefined;

    if (payload.assignedToPublicId) {
      const assignee = await this.databaseService.one<{ id: number }>(
        `
          SELECT id
          FROM landing_core.tb_admin_users
          WHERE public_id = $1::uuid
            AND deleted_at IS NULL
        `,
        [payload.assignedToPublicId],
      );

      if (!assignee) {
        throw new NotFoundException(
          'No se encontro el administrador asignado.',
        );
      }

      assignedToId = assignee.id;
    }

    const updateData = buildSetClause(
      {
        status: payload.status,
        assigned_to: assignedToId,
        admin_notes: payload.adminNotes,
        first_response_at:
          payload.firstResponseAt ??
          (payload.status === 'contacted'
            ? new Date().toISOString()
            : undefined),
        closed_at:
          payload.closedAt ??
          (payload.status && ['won', 'lost', 'closed'].includes(payload.status)
            ? new Date().toISOString()
            : undefined),
        updated_at: new Date(),
      },
      1,
    );

    const updated = await this.databaseService.one(
      `
        UPDATE landing_core.tb_contact_requests
        SET ${updateData.setClause}
        WHERE public_id = $${updateData.values.length + 1}::uuid
        RETURNING
          id,
          public_id AS "publicId",
          status,
          assigned_to AS "assignedTo",
          admin_notes AS "adminNotes",
          updated_at AS "updatedAt"
      `,
      [...updateData.values, publicId],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'contacts.update',
      entityName: 'tb_contact_requests',
      entityId: existing.id,
      description: `Lead actualizado a estado ${payload.status ?? existing.status}`,
      oldData: existing as Record<string, unknown>,
      newData: updated as Record<string, unknown>,
      request,
    });

    return this.findOne(publicId);
  }
}
