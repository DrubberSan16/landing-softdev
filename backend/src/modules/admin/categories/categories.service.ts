import { Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { DatabaseService } from '../../../common/database/database.service';
import { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';
import { buildSetClause } from '../../../common/utils/build-set-clause.util';
import { AuditService } from '../audit/audit.service';
import {
  CategoryListQueryDto,
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/upsert-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: CategoryListQueryDto) {
    const filters: string[] = ['1 = 1'];
    const values: unknown[] = [];

    if (query.search) {
      values.push(`%${query.search}%`);
      filters.push(
        `(c.name ILIKE $${values.length} OR c.slug ILIKE $${values.length} OR COALESCE(c.description, '') ILIKE $${values.length})`,
      );
    }

    if (query.status !== undefined) {
      values.push(query.status);
      filters.push(`c.status = $${values.length}`);
    }

    if (query.createdByPublicId) {
      values.push(query.createdByPublicId);
      filters.push(`creator.public_id = $${values.length}::uuid`);
    }

    return this.databaseService.query(
      `
        SELECT
          c.id,
          c.public_id AS "publicId",
          c.name,
          c.slug,
          c.description,
          c.icon,
          c.sort_order AS "sortOrder",
          c.status,
          c.created_at AS "createdAt",
          c.updated_at AS "updatedAt",
          creator.public_id AS "createdByPublicId",
          creator.full_name AS "createdByFullName",
          updater.public_id AS "updatedByPublicId",
          updater.full_name AS "updatedByFullName"
        FROM landing_core.tb_project_categories c
        LEFT JOIN landing_core.tb_admin_users creator
          ON creator.id = c.created_by
        LEFT JOIN landing_core.tb_admin_users updater
          ON updater.id = c.updated_by
        WHERE ${filters.join(' AND ')}
        ORDER BY c.sort_order ASC, c.name ASC
      `,
      values,
    );
  }

  async create(
    payload: CreateCategoryDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const created = await this.databaseService.one<{
      id: number;
      publicId: string;
      name: string;
      slug: string;
    }>(
      `
        INSERT INTO landing_core.tb_project_categories (
          name,
          slug,
          description,
          icon,
          sort_order,
          status,
          created_by,
          updated_by,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, COALESCE($6, TRUE), $7, $7, NOW(), NOW())
        RETURNING id, public_id AS "publicId", name, slug
      `,
      [
        payload.name,
        payload.slug,
        payload.description ?? null,
        payload.icon ?? null,
        payload.sortOrder ?? 0,
        payload.status ?? true,
        admin.id,
      ],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'categories.create',
      entityName: 'tb_project_categories',
      entityId: created?.id ?? null,
      description: `Categoria creada: ${payload.name}`,
      newData: created as Record<string, unknown>,
      request,
    });

    return created;
  }

  async update(
    publicId: string,
    payload: UpdateCategoryDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const existing = await this.databaseService.one<{
      id: number;
      name: string;
      slug: string;
    }>(
      `
        SELECT id, name, slug
        FROM landing_core.tb_project_categories
        WHERE public_id = $1::uuid
      `,
      [publicId],
    );

    if (!existing) {
      throw new NotFoundException('No se encontro la categoria solicitada.');
    }

    const updateData = buildSetClause(
      {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        icon: payload.icon,
        sort_order: payload.sortOrder,
        status: payload.status,
        updated_by: admin.id,
        updated_at: new Date(),
      },
      1,
    );

    const updated = await this.databaseService.one(
      `
        UPDATE landing_core.tb_project_categories
        SET ${updateData.setClause}
        WHERE public_id = $${updateData.values.length + 1}::uuid
        RETURNING id, public_id AS "publicId", name, slug, status
      `,
      [...updateData.values, publicId],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'categories.update',
      entityName: 'tb_project_categories',
      entityId: existing.id,
      description: `Categoria actualizada: ${existing.name}`,
      oldData: existing as Record<string, unknown>,
      newData: updated as Record<string, unknown>,
      request,
    });

    return updated;
  }
}
