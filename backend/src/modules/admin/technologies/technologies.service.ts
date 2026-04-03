import { Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { DatabaseService } from '../../../common/database/database.service';
import { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';
import { buildSetClause } from '../../../common/utils/build-set-clause.util';
import { AuditService } from '../audit/audit.service';
import {
  CreateTechnologyDto,
  TechnologyListQueryDto,
  UpdateTechnologyDto,
} from './dto/upsert-technology.dto';

@Injectable()
export class TechnologiesService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
  ) {}

  async list(query: TechnologyListQueryDto) {
    const filters: string[] = ['1 = 1'];
    const values: unknown[] = [];

    if (query.search) {
      values.push(`%${query.search}%`);
      filters.push(
        `(name ILIKE $${values.length} OR slug ILIKE $${values.length} OR COALESCE(description, '') ILIKE $${values.length})`,
      );
    }

    if (query.status !== undefined) {
      values.push(query.status);
      filters.push(`status = $${values.length}`);
    }

    return this.databaseService.query(
      `
        SELECT
          id,
          public_id AS "publicId",
          name,
          slug,
          description,
          icon,
          official_url AS "officialUrl",
          color_hex AS "colorHex",
          status,
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM landing_core.tb_technologies
        WHERE ${filters.join(' AND ')}
        ORDER BY name ASC
      `,
      values,
    );
  }

  async create(
    payload: CreateTechnologyDto,
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
        INSERT INTO landing_core.tb_technologies (
          name,
          slug,
          description,
          icon,
          official_url,
          color_hex,
          status,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, TRUE), NOW(), NOW())
        RETURNING id, public_id AS "publicId", name, slug
      `,
      [
        payload.name,
        payload.slug,
        payload.description ?? null,
        payload.icon ?? null,
        payload.officialUrl ?? null,
        payload.colorHex ?? null,
        payload.status ?? true,
      ],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'technologies.create',
      entityName: 'tb_technologies',
      entityId: created?.id ?? null,
      description: `Tecnologia creada: ${payload.name}`,
      newData: created as Record<string, unknown>,
      request,
    });

    return created;
  }

  async update(
    publicId: string,
    payload: UpdateTechnologyDto,
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
        FROM landing_core.tb_technologies
        WHERE public_id = $1::uuid
      `,
      [publicId],
    );

    if (!existing) {
      throw new NotFoundException('No se encontro la tecnologia solicitada.');
    }

    const updateData = buildSetClause(
      {
        name: payload.name,
        slug: payload.slug,
        description: payload.description,
        icon: payload.icon,
        official_url: payload.officialUrl,
        color_hex: payload.colorHex,
        status: payload.status,
        updated_at: new Date(),
      },
      1,
    );

    const updated = await this.databaseService.one(
      `
        UPDATE landing_core.tb_technologies
        SET ${updateData.setClause}
        WHERE public_id = $${updateData.values.length + 1}::uuid
        RETURNING id, public_id AS "publicId", name, slug, status
      `,
      [...updateData.values, publicId],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'technologies.update',
      entityName: 'tb_technologies',
      entityId: existing.id,
      description: `Tecnologia actualizada: ${existing.name}`,
      oldData: existing as Record<string, unknown>,
      newData: updated as Record<string, unknown>,
      request,
    });

    return updated;
  }
}
