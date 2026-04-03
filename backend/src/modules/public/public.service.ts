import { Injectable, NotFoundException } from '@nestjs/common';
import { Request } from 'express';
import { DatabaseService } from '../../common/database/database.service';
import {
  getRequestIp,
  getRequestUserAgent,
} from '../../common/utils/request-context.util';
import { CreateContactRequestDto } from './dto/create-contact-request.dto';
import { PublicProjectQueryDto } from './dto/public-project-query.dto';
import { TrackDemoClickDto } from './dto/track-demo-click.dto';
import { TrackPageViewDto } from './dto/track-page-view.dto';

type ProjectIdentity = {
  id: number;
  publicId: string;
  slug: string;
  title: string;
  demoUrl: string;
};

@Injectable()
export class PublicService {
  constructor(private readonly databaseService: DatabaseService) {}

  async getHomeData() {
    const [featuredProjects, categories, technologies] = await Promise.all([
      this.databaseService.query(
        `
          SELECT
            p.public_id AS "publicId",
            p.title,
            p.slug,
            p.short_description AS "shortDescription",
            p.cover_image_url AS "coverImageUrl",
            p.logo_url AS "logoUrl",
            p.version_label AS "versionLabel",
            p.demo_url AS "demoUrl",
            p.total_project_views AS "totalProjectViews",
            p.total_demo_clicks AS "totalDemoClicks",
            c.name AS "categoryName",
            c.slug AS "categorySlug"
          FROM landing_core.tb_projects p
          LEFT JOIN landing_core.tb_project_categories c
            ON c.id = p.category_id
          WHERE p.status = 'published'
            AND p.visibility = 'public'
            AND p.deleted_at IS NULL
            AND p.is_featured = TRUE
          ORDER BY p.sort_order ASC, p.published_at DESC NULLS LAST, p.title ASC
          LIMIT 6
        `,
      ),
      this.listCategories(),
      this.listTechnologies(),
    ]);

    return {
      featuredProjects,
      categories,
      technologies,
    };
  }

  async listProjects(query: PublicProjectQueryDto) {
    const offset = (query.page - 1) * query.limit;
    const filters: string[] = [
      `p.status = 'published'`,
      `p.visibility = 'public'`,
      `p.deleted_at IS NULL`,
    ];
    const values: unknown[] = [];

    if (query.categorySlug) {
      values.push(query.categorySlug);
      filters.push(`c.slug = $${values.length}`);
    }

    if (query.technologySlug) {
      values.push(query.technologySlug);
      filters.push(`
        EXISTS (
          SELECT 1
          FROM landing_core.tb_project_technologies ptf
          JOIN landing_core.tb_technologies tf
            ON tf.id = ptf.technology_id
          WHERE ptf.project_id = p.id
            AND tf.slug = $${values.length}
        )
      `);
    }

    if (query.featured !== undefined) {
      values.push(query.featured);
      filters.push(`p.is_featured = $${values.length}`);
    }

    if (query.search) {
      values.push(`%${query.search}%`);
      filters.push(
        `(p.title ILIKE $${values.length} OR p.short_description ILIKE $${values.length} OR COALESCE(p.full_description, '') ILIKE $${values.length})`,
      );
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const [items, totalRow] = await Promise.all([
      this.databaseService.query(
        `
          ${this.publicProjectSelect()}
          ${whereClause}
          ORDER BY p.is_featured DESC, p.sort_order ASC, p.published_at DESC NULLS LAST, p.title ASC
          LIMIT $${values.length + 1}
          OFFSET $${values.length + 2}
        `,
        [...values, query.limit, offset],
      ),
      this.databaseService.one<{ total: string }>(
        `
          SELECT COUNT(*)::text AS total
          FROM landing_core.tb_projects p
          LEFT JOIN landing_core.tb_project_categories c
            ON c.id = p.category_id
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

  async getProjectBySlug(slug: string) {
    const project = await this.databaseService.one(
      `
        ${this.publicProjectSelect()}
        WHERE p.slug = $1
          AND p.status = 'published'
          AND p.visibility = 'public'
          AND p.deleted_at IS NULL
      `,
      [slug],
    );

    if (!project) {
      throw new NotFoundException('No se encontro el proyecto solicitado.');
    }

    const relatedProjects = await this.databaseService.query(
      `
        SELECT
          p.public_id AS "publicId",
          p.title,
          p.slug,
          p.short_description AS "shortDescription",
          p.cover_image_url AS "coverImageUrl",
          p.demo_url AS "demoUrl"
        FROM landing_core.tb_projects p
        WHERE p.status = 'published'
          AND p.visibility = 'public'
          AND p.deleted_at IS NULL
          AND p.slug <> $1
          AND (
            p.category_id = (
              SELECT category_id
              FROM landing_core.tb_projects
              WHERE slug = $1
            )
            OR p.is_featured = TRUE
          )
        ORDER BY p.is_featured DESC, p.sort_order ASC, p.published_at DESC NULLS LAST
        LIMIT 3
      `,
      [slug],
    );

    return {
      ...project,
      relatedProjects,
    };
  }

  async listCategories() {
    return this.databaseService.query(
      `
        SELECT
          public_id AS "publicId",
          name,
          slug,
          description,
          icon,
          sort_order AS "sortOrder"
        FROM landing_core.tb_project_categories
        WHERE status = TRUE
        ORDER BY sort_order ASC, name ASC
      `,
    );
  }

  async listTechnologies() {
    return this.databaseService.query(
      `
        SELECT
          public_id AS "publicId",
          name,
          slug,
          description,
          icon,
          official_url AS "officialUrl",
          color_hex AS "colorHex"
        FROM landing_core.tb_technologies
        WHERE status = TRUE
        ORDER BY name ASC
      `,
    );
  }

  async createContactRequest(payload: CreateContactRequestDto) {
    const project = await this.resolveProjectIdentity(
      payload.projectPublicId,
      payload.projectSlug,
    );

    const contact = await this.databaseService.one<{
      publicId: string;
      status: string;
    }>(
      `
        INSERT INTO landing_core.tb_contact_requests (
          project_id,
          full_name,
          company_name,
          email,
          phone,
          preferred_contact_method,
          subject,
          message,
          budget_range,
          source_path,
          source_page_url,
          terms_accepted,
          wants_notifications,
          status,
          created_at,
          updated_at
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          COALESCE($6, 'email'),
          $7,
          $8,
          $9,
          $10,
          $11,
          COALESCE($12, FALSE),
          COALESCE($13, TRUE),
          'new',
          NOW(),
          NOW()
        )
        RETURNING public_id AS "publicId", status
      `,
      [
        project?.id ?? null,
        payload.fullName,
        payload.companyName ?? null,
        payload.email,
        payload.phone ?? null,
        payload.preferredContactMethod ?? 'email',
        payload.subject,
        payload.message,
        payload.budgetRange ?? null,
        payload.sourcePath ?? null,
        payload.sourcePageUrl ?? null,
        payload.termsAccepted ?? false,
        payload.wantsNotifications ?? true,
      ],
    );

    return {
      message: 'Solicitud registrada correctamente.',
      contactRequest: contact,
      relatedProject: project
        ? {
            publicId: project.publicId,
            slug: project.slug,
            title: project.title,
          }
        : null,
    };
  }

  async trackPageView(payload: TrackPageViewDto, request: Request) {
    const project = await this.resolveProjectIdentity(
      payload.projectPublicId,
      payload.projectSlug,
    );

    const result = await this.databaseService.one<{
      visitor_id: string;
      session_id: string;
      page_view_id: string;
    }>(
      `
        SELECT *
        FROM landing_core.fn_track_page_view(
          $1::uuid,
          $2::uuid,
          $3::varchar,
          $4::varchar,
          $5::bigint,
          $6::varchar,
          $7::inet,
          $8::text,
          $9::text,
          $10::varchar,
          $11::varchar,
          $12::varchar,
          $13::int,
          $14::varchar,
          $15::varchar
        )
      `,
      [
        payload.anonymousId,
        payload.sessionToken,
        payload.path,
        payload.pageType,
        project?.id ?? null,
        payload.routeName ?? null,
        getRequestIp(request),
        getRequestUserAgent(request),
        payload.referrerUrl ?? null,
        payload.deviceType ?? null,
        payload.browserName ?? null,
        payload.osName ?? null,
        payload.durationSeconds ?? null,
        payload.countryCode ?? null,
        payload.cityName ?? null,
      ],
    );

    return {
      visitorId: Number(result?.visitor_id ?? 0),
      sessionId: Number(result?.session_id ?? 0),
      pageViewId: Number(result?.page_view_id ?? 0),
    };
  }

  async trackDemoClick(payload: TrackDemoClickDto) {
    const project = await this.resolveProjectIdentity(
      payload.projectPublicId,
      payload.projectSlug,
    );

    if (!project) {
      throw new NotFoundException(
        'No se encontro el proyecto para registrar el click.',
      );
    }

    const result = await this.databaseService.one<{ clickId: string }>(
      `
        SELECT landing_core.fn_track_demo_click($1::uuid, $2::bigint, $3::text)::text AS "clickId"
      `,
      [payload.sessionToken, project.id, payload.referrerUrl ?? null],
    );

    return {
      clickId: Number(result?.clickId ?? 0),
      targetUrl: project.demoUrl,
      project: {
        publicId: project.publicId,
        slug: project.slug,
        title: project.title,
      },
    };
  }

  async resolveDemoRedirect(
    slug: string,
    sessionToken: string,
    referrerUrl?: string,
  ) {
    const tracked = await this.trackDemoClick({
      sessionToken,
      projectSlug: slug,
      referrerUrl,
    });

    return tracked.targetUrl;
  }

  private async resolveProjectIdentity(
    projectPublicId?: string,
    projectSlug?: string,
  ): Promise<ProjectIdentity | null> {
    if (!projectPublicId && !projectSlug) {
      return null;
    }

    return this.databaseService.one<ProjectIdentity>(
      `
        SELECT
          id,
          public_id AS "publicId",
          slug,
          title,
          demo_url AS "demoUrl"
        FROM landing_core.tb_projects
        WHERE deleted_at IS NULL
          AND (
            ($1::uuid IS NOT NULL AND public_id = $1::uuid)
            OR ($2::varchar IS NOT NULL AND slug = $2::varchar)
          )
        LIMIT 1
      `,
      [projectPublicId ?? null, projectSlug ?? null],
    );
  }

  private publicProjectSelect(): string {
    return `
      SELECT
        p.public_id AS "publicId",
        p.title,
        p.slug,
        p.short_description AS "shortDescription",
        p.full_description AS "fullDescription",
        p.client_name AS "clientName",
        p.business_sector AS "businessSector",
        p.demo_schema_name AS "demoSchemaName",
        p.demo_url AS "demoUrl",
        p.repository_url AS "repositoryUrl",
        p.video_url AS "videoUrl",
        p.documentation_url AS "documentationUrl",
        p.cover_image_url AS "coverImageUrl",
        p.logo_url AS "logoUrl",
        p.version_label AS "versionLabel",
        p.is_featured AS "isFeatured",
        p.sort_order AS "sortOrder",
        p.status,
        p.visibility,
        p.published_at AS "publishedAt",
        p.total_project_views AS "totalProjectViews",
        p.total_demo_clicks AS "totalDemoClicks",
        p.total_unique_visitors AS "totalUniqueVisitors",
        p.total_contact_requests AS "totalContactRequests",
        p.meta_title AS "metaTitle",
        p.meta_description AS "metaDescription",
        c.public_id AS "categoryPublicId",
        c.name AS "categoryName",
        c.slug AS "categorySlug",
        COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'publicId', t.public_id,
              'name', t.name,
              'slug', t.slug,
              'icon', t.icon,
              'colorHex', t.color_hex,
              'officialUrl', t.official_url,
              'isPrimary', pt.is_primary
            )
            ORDER BY pt.is_primary DESC, t.name ASC
          )
          FROM landing_core.tb_project_technologies pt
          JOIN landing_core.tb_technologies t
            ON t.id = pt.technology_id
          WHERE pt.project_id = p.id
            AND t.status = TRUE
        ), '[]'::jsonb) AS technologies,
        COALESCE((
          SELECT jsonb_agg(
            jsonb_build_object(
              'id', pm.id,
              'mediaType', pm.media_type,
              'fileUrl', pm.file_url,
              'thumbnailUrl', pm.thumbnail_url,
              'title', pm.title,
              'altText', pm.alt_text,
              'sortOrder', pm.sort_order,
              'isCover', pm.is_cover
            )
            ORDER BY pm.is_cover DESC, pm.sort_order ASC, pm.id ASC
          )
          FROM landing_core.tb_project_media pm
          WHERE pm.project_id = p.id
        ), '[]'::jsonb) AS media
      FROM landing_core.tb_projects p
      LEFT JOIN landing_core.tb_project_categories c
        ON c.id = p.category_id
    `;
  }
}
