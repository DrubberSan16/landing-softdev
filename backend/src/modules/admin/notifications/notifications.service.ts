import { Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { DatabaseService } from '../../../common/database/database.service';
import { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';
import { buildSetClause } from '../../../common/utils/build-set-clause.util';
import { AuditService } from '../audit/audit.service';
import {
  NotificationPreferenceQueryDto,
  NotificationQueueQueryDto,
} from './dto/notification-query.dto';
import {
  UpdateNotificationPreferenceDto,
  UpdateNotificationQueueDto,
} from './dto/update-notification.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async listQueue(query: NotificationQueueQueryDto) {
    const offset = (query.page - 1) * query.limit;
    const filters: string[] = ['1 = 1'];
    const values: unknown[] = [];

    if (query.status) {
      values.push(query.status);
      filters.push(`q.status = $${values.length}`);
    }

    if (query.eventCode) {
      values.push(query.eventCode);
      filters.push(`q.event_code = $${values.length}`);
    }

    if (query.projectPublicId) {
      values.push(query.projectPublicId);
      filters.push(`p.public_id = $${values.length}::uuid`);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const [items, totalRow] = await Promise.all([
      this.databaseService.query(
        `
          SELECT
            q.id,
            q.event_code AS "eventCode",
            q.related_table AS "relatedTable",
            q.related_id AS "relatedId",
            q.recipient_to AS "recipientTo",
            q.recipient_name AS "recipientName",
            q.payload,
            q.subject_override AS "subjectOverride",
            q.scheduled_at AS "scheduledAt",
            q.processing_started_at AS "processingStartedAt",
            q.processed_at AS "processedAt",
            q.attempts,
            q.max_attempts AS "maxAttempts",
            q.status,
            q.provider_message_id AS "providerMessageId",
            q.error_message AS "errorMessage",
            q.created_at AS "createdAt",
            q.updated_at AS "updatedAt",
            ch.code AS "channelCode",
            ch.name AS "channelName",
            tpl.name AS "templateName",
            p.public_id AS "projectPublicId",
            p.title AS "projectTitle"
          FROM landing_core.tb_notification_queue q
          JOIN landing_core.tb_notification_channels ch
            ON ch.id = q.channel_id
          LEFT JOIN landing_core.tb_notification_templates tpl
            ON tpl.id = q.template_id
          LEFT JOIN landing_core.tb_projects p
            ON p.id = q.project_id
          ${whereClause}
          ORDER BY q.created_at DESC, q.id DESC
          LIMIT $${values.length + 1}
          OFFSET $${values.length + 2}
        `,
        [...values, query.limit, offset],
      ),
      this.databaseService.one<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM landing_core.tb_notification_queue q
          LEFT JOIN landing_core.tb_projects p
            ON p.id = q.project_id
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

  async listChannels() {
    return this.databaseService.query(
      `
        SELECT
          id,
          code,
          name,
          description,
          is_active AS "isActive",
          created_at AS "createdAt"
        FROM landing_core.tb_notification_channels
        ORDER BY name ASC
      `,
    );
  }

  async listTemplates() {
    return this.databaseService.query(
      `
        SELECT
          tpl.id,
          tpl.event_code AS "eventCode",
          tpl.name,
          tpl.subject_template AS "subjectTemplate",
          tpl.body_template AS "bodyTemplate",
          tpl.is_active AS "isActive",
          tpl.created_at AS "createdAt",
          tpl.updated_at AS "updatedAt",
          ch.code AS "channelCode",
          ch.name AS "channelName"
        FROM landing_core.tb_notification_templates tpl
        JOIN landing_core.tb_notification_channels ch
          ON ch.id = tpl.channel_id
        ORDER BY tpl.event_code ASC, tpl.name ASC
      `,
    );
  }

  async listPreferences(query: NotificationPreferenceQueryDto) {
    const filters: string[] = ['1 = 1'];
    const values: unknown[] = [];

    if (query.adminUserPublicId) {
      values.push(query.adminUserPublicId);
      filters.push(`au.public_id = $${values.length}::uuid`);
    }

    return this.databaseService.query(
      `
        SELECT
          pref.id,
          pref.event_code AS "eventCode",
          pref.is_enabled AS "isEnabled",
          pref.created_at AS "createdAt",
          pref.updated_at AS "updatedAt",
          au.public_id AS "adminUserPublicId",
          au.full_name AS "adminUserFullName",
          ch.code AS "channelCode",
          ch.name AS "channelName"
        FROM landing_core.tb_admin_notification_preferences pref
        JOIN landing_core.tb_admin_users au
          ON au.id = pref.admin_user_id
        JOIN landing_core.tb_notification_channels ch
          ON ch.id = pref.channel_id
        WHERE ${filters.join(' AND ')}
        ORDER BY au.full_name ASC, pref.event_code ASC
      `,
      values,
    );
  }

  async updateQueueItem(
    id: number,
    payload: UpdateNotificationQueueDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const existing = await this.databaseService.one<{
      id: number;
      status: string;
    }>(
      `
        SELECT id, status
        FROM landing_core.tb_notification_queue
        WHERE id = $1
      `,
      [id],
    );

    if (!existing) {
      throw new NotFoundException('No se encontro el item de cola solicitado.');
    }

    const updateData = buildSetClause(
      {
        status: payload.status,
        error_message: payload.errorMessage,
        processed_at: payload.status === 'sent' ? new Date() : undefined,
        updated_at: new Date(),
      },
      1,
    );

    const updated = await this.databaseService.one(
      `
        UPDATE landing_core.tb_notification_queue
        SET ${updateData.setClause}
        WHERE id = $${updateData.values.length + 1}
        RETURNING id, status, error_message AS "errorMessage", updated_at AS "updatedAt"
      `,
      [...updateData.values, id],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'notifications.queue.update',
      entityName: 'tb_notification_queue',
      entityId: id,
      description: `Cola de notificacion actualizada a ${payload.status ?? existing.status}`,
      oldData: existing as Record<string, unknown>,
      newData: updated as Record<string, unknown>,
      request,
    });

    return updated;
  }

  async updatePreference(
    id: number,
    payload: UpdateNotificationPreferenceDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const existing = await this.databaseService.one<{
      id: number;
      isEnabled: boolean;
    }>(
      `
        SELECT id, is_enabled AS "isEnabled"
        FROM landing_core.tb_admin_notification_preferences
        WHERE id = $1
      `,
      [id],
    );

    if (!existing) {
      throw new NotFoundException('No se encontro la preferencia solicitada.');
    }

    const updateData = buildSetClause(
      {
        is_enabled: payload.isEnabled,
        updated_at: new Date(),
      },
      1,
    );

    const updated = await this.databaseService.one(
      `
        UPDATE landing_core.tb_admin_notification_preferences
        SET ${updateData.setClause}
        WHERE id = $${updateData.values.length + 1}
        RETURNING id, is_enabled AS "isEnabled", updated_at AS "updatedAt"
      `,
      [...updateData.values, id],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'notifications.preferences.update',
      entityName: 'tb_admin_notification_preferences',
      entityId: id,
      description: 'Preferencia de notificacion actualizada',
      oldData: existing as Record<string, unknown>,
      newData: updated as Record<string, unknown>,
      request,
    });

    return updated;
  }
}
