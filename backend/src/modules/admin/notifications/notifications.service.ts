import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
import {
  CreateNotificationChannelDto,
  CreateNotificationTemplateDto,
  UpdateNotificationChannelDto,
  UpdateNotificationTemplateDto,
} from './dto/upsert-notification-config.dto';

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

  async createChannel(
    payload: CreateNotificationChannelDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const created = await this.databaseService.one<{
      id: number;
      code: string;
      name: string;
    }>(
      `
        INSERT INTO landing_core.tb_notification_channels (
          code, name, description, is_active, created_at
        )
        VALUES ($1, $2, $3, COALESCE($4, TRUE), NOW())
        RETURNING id, code, name
      `,
      [
        payload.code.trim().toLowerCase(),
        payload.name,
        payload.description ?? null,
        payload.isActive ?? true,
      ],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'notifications.channels.create',
      entityName: 'tb_notification_channels',
      entityId: created?.id ?? null,
      description: `Canal de notificacion creado: ${payload.name}`,
      newData: created as Record<string, unknown>,
      request,
    });

    return created;
  }

  async updateChannel(
    id: number,
    payload: UpdateNotificationChannelDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const existing = await this.getChannel(id);
    const updateData = buildSetClause(
      {
        code: payload.code?.trim().toLowerCase(),
        name: payload.name,
        description: payload.description,
        is_active: payload.isActive,
      },
      1,
    );
    const updated = await this.databaseService.one(
      `
        UPDATE landing_core.tb_notification_channels
        SET ${updateData.setClause}
        WHERE id = $${updateData.values.length + 1}
        RETURNING id, code, name, description, is_active AS "isActive"
      `,
      [...updateData.values, id],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'notifications.channels.update',
      entityName: 'tb_notification_channels',
      entityId: id,
      description: `Canal de notificacion actualizado: ${existing.name}`,
      oldData: existing as Record<string, unknown>,
      newData: updated as Record<string, unknown>,
      request,
    });

    return updated;
  }

  async removeChannel(id: number, admin: CurrentAdmin, request: Request) {
    const existing = await this.getChannel(id);
    const dependencies = await this.databaseService.one<{
      templates: string;
      preferences: string;
      queueItems: string;
    }>(
      `
        SELECT
          (SELECT COUNT(*) FROM landing_core.tb_notification_templates WHERE channel_id = $1)::text AS templates,
          (SELECT COUNT(*) FROM landing_core.tb_admin_notification_preferences WHERE channel_id = $1)::text AS preferences,
          (SELECT COUNT(*) FROM landing_core.tb_notification_queue WHERE channel_id = $1)::text AS "queueItems"
      `,
      [id],
    );

    if (
      Number(dependencies?.templates ?? 0) > 0 ||
      Number(dependencies?.preferences ?? 0) > 0 ||
      Number(dependencies?.queueItems ?? 0) > 0
    ) {
      throw new ConflictException(
        'El canal tiene plantillas, preferencias o envios asociados. Desactivalo en lugar de eliminarlo.',
      );
    }

    await this.databaseService.query(
      `DELETE FROM landing_core.tb_notification_channels WHERE id = $1`,
      [id],
    );
    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'notifications.channels.delete',
      entityName: 'tb_notification_channels',
      entityId: id,
      description: `Canal de notificacion eliminado: ${existing.name}`,
      oldData: existing as Record<string, unknown>,
      request,
    });

    return { message: 'Canal eliminado correctamente.' };
  }

  async createTemplate(
    payload: CreateNotificationTemplateDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const channelId = await this.resolveChannelId(payload.channelCode);
    const created = await this.databaseService.one<{
      id: number;
      name: string;
      eventCode: string;
    }>(
      `
        INSERT INTO landing_core.tb_notification_templates (
          event_code, channel_id, name, subject_template, body_template,
          is_active, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, COALESCE($6, TRUE), NOW(), NOW())
        RETURNING id, name, event_code AS "eventCode"
      `,
      [
        payload.eventCode,
        channelId,
        payload.name,
        payload.subjectTemplate ?? null,
        payload.bodyTemplate,
        payload.isActive ?? true,
      ],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'notifications.templates.create',
      entityName: 'tb_notification_templates',
      entityId: created?.id ?? null,
      description: `Plantilla de notificacion creada: ${payload.name}`,
      newData: created as Record<string, unknown>,
      request,
    });

    return created;
  }

  async updateTemplate(
    id: number,
    payload: UpdateNotificationTemplateDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const existing = await this.getTemplate(id);
    const channelId = payload.channelCode
      ? await this.resolveChannelId(payload.channelCode)
      : undefined;
    const updateData = buildSetClause(
      {
        event_code: payload.eventCode,
        channel_id: channelId,
        name: payload.name,
        subject_template: payload.subjectTemplate,
        body_template: payload.bodyTemplate,
        is_active: payload.isActive,
        updated_at: new Date(),
      },
      1,
    );
    const updated = await this.databaseService.one(
      `
        UPDATE landing_core.tb_notification_templates
        SET ${updateData.setClause}
        WHERE id = $${updateData.values.length + 1}
        RETURNING id, event_code AS "eventCode", name, is_active AS "isActive"
      `,
      [...updateData.values, id],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'notifications.templates.update',
      entityName: 'tb_notification_templates',
      entityId: id,
      description: `Plantilla de notificacion actualizada: ${existing.name}`,
      oldData: existing as Record<string, unknown>,
      newData: updated as Record<string, unknown>,
      request,
    });

    return updated;
  }

  async removeTemplate(id: number, admin: CurrentAdmin, request: Request) {
    const existing = await this.getTemplate(id);
    await this.databaseService.query(
      `DELETE FROM landing_core.tb_notification_templates WHERE id = $1`,
      [id],
    );
    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'notifications.templates.delete',
      entityName: 'tb_notification_templates',
      entityId: id,
      description: `Plantilla de notificacion eliminada: ${existing.name}`,
      oldData: existing as Record<string, unknown>,
      request,
    });

    return { message: 'Plantilla eliminada correctamente.' };
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

  private async getChannel(id: number) {
    const channel = await this.databaseService.one<{
      id: number;
      code: string;
      name: string;
      description: string | null;
      isActive: boolean;
    }>(
      `SELECT id, code, name, description, is_active AS "isActive" FROM landing_core.tb_notification_channels WHERE id = $1`,
      [id],
    );

    if (!channel) {
      throw new NotFoundException('No se encontro el canal solicitado.');
    }

    return channel;
  }

  private async getTemplate(id: number) {
    const template = await this.databaseService.one<{
      id: number;
      name: string;
      eventCode: string;
      isActive: boolean;
    }>(
      `SELECT id, name, event_code AS "eventCode", is_active AS "isActive" FROM landing_core.tb_notification_templates WHERE id = $1`,
      [id],
    );

    if (!template) {
      throw new NotFoundException('No se encontro la plantilla solicitada.');
    }

    return template;
  }

  private async resolveChannelId(code: string) {
    const channel = await this.databaseService.one<{ id: number }>(
      `SELECT id FROM landing_core.tb_notification_channels WHERE code = $1`,
      [code],
    );

    if (!channel) {
      throw new NotFoundException('No se encontro el canal seleccionado.');
    }

    return channel.id;
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
