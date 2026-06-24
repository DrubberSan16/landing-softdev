import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PoolClient } from 'pg';
import { Request } from 'express';
import { DatabaseService } from '../../../common/database/database.service';
import { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';
import { buildSetClause } from '../../../common/utils/build-set-clause.util';
import { AuditService } from '../audit/audit.service';
import {
  CreateProjectMediaDto,
  UpdateProjectMediaDto,
} from './dto/project-media.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { CreateProjectDto, UpdateProjectDto } from './dto/upsert-project.dto';

type ProjectIdentity = {
  id: number;
  publicId: string;
  title: string;
  slug: string;
  status: string;
  publishedAt: string | null;
};

type ProjectForDocumentation = ProjectIdentity & {
  shortDescription: string;
  fullDescription: string | null;
  clientName: string | null;
  businessSector: string | null;
  demoSchemaName: string | null;
  demoUrl: string;
  repositoryUrl: string | null;
  videoUrl: string | null;
  documentationUrl: string | null;
  coverImageUrl: string | null;
  logoUrl: string | null;
  versionLabel: string | null;
  visibility: string;
  metaTitle: string | null;
  metaDescription: string | null;
  categoryName: string | null;
  technologies: Array<{
    name?: string;
    slug?: string;
    officialUrl?: string;
  }>;
};

type GeneratedProjectDocumentation = {
  shortDescription: string;
  fullDescription: string;
  metaTitle: string;
  metaDescription: string;
  clientName: string;
  businessSector: string;
  presentationSummary: string;
  sellingPoints: string[];
  demoFlow: string[];
  faq: Array<{
    question: string;
    answer: string;
  }>;
  callToAction: string;
};

type OpenAiContentPart = {
  type?: string;
  text?: string;
  refusal?: string;
};

type OpenAiOutputItem = {
  type?: string;
  content?: OpenAiContentPart[];
};

type OpenAiResponsePayload = {
  output_text?: string;
  output?: OpenAiOutputItem[];
  error?: {
    message?: string;
  };
};

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  async list(query: ProjectQueryDto) {
    const offset = (query.page - 1) * query.limit;
    const filters: string[] = [`p.deleted_at IS NULL`];
    const values: unknown[] = [];

    if (query.search) {
      values.push(`%${query.search}%`);
      filters.push(
        `(p.title ILIKE $${values.length} OR p.slug ILIKE $${values.length} OR p.short_description ILIKE $${values.length})`,
      );
    }

    if (query.status) {
      values.push(query.status);
      filters.push(`p.status = $${values.length}`);
    }

    if (query.visibility) {
      values.push(query.visibility);
      filters.push(`p.visibility = $${values.length}`);
    }

    if (query.categoryPublicId) {
      values.push(query.categoryPublicId);
      filters.push(`c.public_id = $${values.length}::uuid`);
    }

    if (query.featured === 'true' || query.featured === 'false') {
      values.push(query.featured === 'true');
      filters.push(`p.is_featured = $${values.length}`);
    }

    const whereClause = `WHERE ${filters.join(' AND ')}`;

    const [items, totalRow] = await Promise.all([
      this.databaseService.query(
        `
          ${this.adminProjectSelect()}
          ${whereClause}
          ORDER BY p.updated_at DESC, p.id DESC
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

  async findOne(publicId: string) {
    const project = await this.databaseService.one(
      `
        ${this.adminProjectSelect()}
        WHERE p.public_id = $1::uuid
          AND p.deleted_at IS NULL
      `,
      [publicId],
    );

    if (!project) {
      throw new NotFoundException('No se encontro el proyecto solicitado.');
    }

    return project;
  }

  async create(
    payload: CreateProjectDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const created = await this.databaseService.transaction(async (client) => {
      const categoryId = await this.resolveCategoryId(
        payload.categoryPublicId,
        client,
      );
      const publishedAt =
        payload.publishedAt ??
        (payload.status === 'published' ? new Date().toISOString() : null);

      const created = await this.databaseService.one<{
        id: number;
        publicId: string;
      }>(
        `
          INSERT INTO landing_core.tb_projects (
            category_id,
            created_by,
            updated_by,
            title,
            slug,
            short_description,
            full_description,
            client_name,
            business_sector,
            demo_schema_name,
            demo_url,
            repository_url,
            video_url,
            documentation_url,
            cover_image_url,
            logo_url,
            version_label,
            is_featured,
            sort_order,
            status,
            visibility,
            published_at,
            meta_title,
            meta_description,
            created_at,
            updated_at
          )
          VALUES (
            $1, $2, $2, $3, $4, $5, $6, $7, $8, $9, $10,
            $11, $12, $13, $14, $15, $16, COALESCE($17, FALSE), COALESCE($18, 0),
            COALESCE($19, 'draft'), COALESCE($20, 'public'), $21,
            $22, $23, NOW(), NOW()
          )
          RETURNING id, public_id AS "publicId"
        `,
        [
          categoryId,
          admin.id,
          payload.title,
          payload.slug,
          payload.shortDescription,
          payload.fullDescription ?? null,
          payload.clientName ?? null,
          payload.businessSector ?? null,
          payload.demoSchemaName ?? null,
          payload.demoUrl,
          payload.repositoryUrl ?? null,
          payload.videoUrl ?? null,
          payload.documentationUrl ?? null,
          payload.coverImageUrl ?? null,
          payload.logoUrl ?? null,
          payload.versionLabel ?? null,
          payload.isFeatured ?? false,
          payload.sortOrder ?? 0,
          payload.status ?? 'draft',
          payload.visibility ?? 'public',
          publishedAt,
          payload.metaTitle ?? null,
          payload.metaDescription ?? null,
        ],
        client,
      );

      await this.syncTechnologies(
        created!.id,
        payload.technologyPublicIds ?? [],
        client,
      );

      return created!;
    });

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'projects.create',
      entityName: 'tb_projects',
      entityId: created.id,
      description: `Proyecto creado: ${payload.title}`,
      newData: {
        publicId: created.publicId,
        slug: payload.slug,
        technologyPublicIds: payload.technologyPublicIds ?? [],
      },
      request,
    });

    return this.findOne(created.publicId);
  }

  async update(
    publicId: string,
    payload: UpdateProjectDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const existing = await this.databaseService.one<ProjectIdentity>(
      `
        SELECT
          id,
          public_id AS "publicId",
          title,
          slug,
          status,
          published_at AS "publishedAt"
        FROM landing_core.tb_projects
        WHERE public_id = $1::uuid
          AND deleted_at IS NULL
      `,
      [publicId],
    );

    if (!existing) {
      throw new NotFoundException('No se encontro el proyecto solicitado.');
    }

    await this.databaseService.transaction(async (client) => {
      const categoryId =
        payload.categoryPublicId !== undefined
          ? await this.resolveCategoryId(payload.categoryPublicId, client)
          : undefined;

      const shouldAutoPublish =
        payload.status === 'published' &&
        existing.status !== 'published' &&
        !payload.publishedAt;

      const updateData = buildSetClause(
        {
          category_id: categoryId,
          updated_by: admin.id,
          title: payload.title,
          slug: payload.slug,
          short_description: payload.shortDescription,
          full_description: payload.fullDescription,
          client_name: payload.clientName,
          business_sector: payload.businessSector,
          demo_schema_name: payload.demoSchemaName,
          demo_url: payload.demoUrl,
          repository_url: payload.repositoryUrl,
          video_url: payload.videoUrl,
          documentation_url: payload.documentationUrl,
          cover_image_url: payload.coverImageUrl,
          logo_url: payload.logoUrl,
          version_label: payload.versionLabel,
          is_featured: payload.isFeatured,
          sort_order: payload.sortOrder,
          status: payload.status,
          visibility: payload.visibility,
          published_at:
            payload.publishedAt ??
            (shouldAutoPublish ? new Date().toISOString() : undefined),
          meta_title: payload.metaTitle,
          meta_description: payload.metaDescription,
          updated_at: new Date(),
        },
        1,
      );

      await this.databaseService.one(
        `
          UPDATE landing_core.tb_projects
          SET ${updateData.setClause}
          WHERE public_id = $${updateData.values.length + 1}::uuid
          RETURNING id
        `,
        [...updateData.values, publicId],
        client,
      );

      if (payload.technologyPublicIds) {
        await this.syncTechnologies(
          existing.id,
          payload.technologyPublicIds,
          client,
        );
      }
    });

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'projects.update',
      entityName: 'tb_projects',
      entityId: existing.id,
      description: `Proyecto actualizado: ${existing.title}`,
      oldData: existing as Record<string, unknown>,
      newData: {
        slug: payload.slug ?? existing.slug,
        technologyPublicIds: payload.technologyPublicIds,
      },
      request,
    });

    return this.findOne(publicId);
  }

  async remove(publicId: string, admin: CurrentAdmin, request: Request) {
    const existing = await this.databaseService.one<ProjectIdentity>(
      `
        SELECT
          id,
          public_id AS "publicId",
          title,
          slug,
          status,
          published_at AS "publishedAt"
        FROM landing_core.tb_projects
        WHERE public_id = $1::uuid
          AND deleted_at IS NULL
      `,
      [publicId],
    );

    if (!existing) {
      throw new NotFoundException('No se encontro el proyecto solicitado.');
    }

    await this.databaseService.query(
      `
        UPDATE landing_core.tb_projects
        SET
          deleted_at = NOW(),
          status = 'archived',
          visibility = 'hidden',
          is_featured = FALSE,
          updated_by = $2,
          updated_at = NOW()
        WHERE public_id = $1::uuid
      `,
      [publicId, admin.id],
    );

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'projects.delete',
      entityName: 'tb_projects',
      entityId: existing.id,
      description: `Proyecto eliminado: ${existing.title}`,
      oldData: existing as Record<string, unknown>,
      request,
    });

    return { message: 'Proyecto eliminado correctamente.' };
  }

  async generateDocumentationDraft(
    publicId: string,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const project = await this.getProjectForDocumentation(publicId);
    const draft = await this.generateDocumentationWithOpenAi(project);
    const projectPatch = this.buildDocumentationProjectPatch(project, draft);

    await this.auditService.log({
      adminUserId: admin.id,
      actionCode: 'projects.ai_documentation.generate',
      entityName: 'tb_projects',
      entityId: project.id,
      description: `Borrador de documentacion generado con OpenAI para ${project.title}`,
      newData: {
        publicId: project.publicId,
        slug: project.slug,
        sourceUrl: project.demoUrl,
        model: this.configService.get<string>('OPENAI_MODEL', 'gpt-5.5'),
      },
      request,
    });

    return {
      project: {
        publicId: project.publicId,
        title: project.title,
        slug: project.slug,
        demoUrl: project.demoUrl,
      },
      draft,
      projectPatch,
    };
  }

  async listMedia(projectPublicId: string) {
    const project = await this.getProjectIdentity(projectPublicId);

    return this.databaseService.query(
      `
        SELECT
          id,
          media_type AS "mediaType",
          file_url AS "fileUrl",
          thumbnail_url AS "thumbnailUrl",
          title,
          alt_text AS "altText",
          sort_order AS "sortOrder",
          is_cover AS "isCover",
          created_at AS "createdAt",
          updated_at AS "updatedAt"
        FROM landing_core.tb_project_media
        WHERE project_id = $1
        ORDER BY is_cover DESC, sort_order ASC, id ASC
      `,
      [project.id],
    );
  }

  async createMedia(
    projectPublicId: string,
    payload: CreateProjectMediaDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const project = await this.getProjectIdentity(projectPublicId);

    return this.databaseService.transaction(async (client) => {
      if (payload.isCover) {
        await this.clearMediaCover(project.id, client);
      }

      const created = await this.databaseService.one<{
        id: number;
        mediaType: string;
        fileUrl: string;
        thumbnailUrl: string | null;
        title: string | null;
        altText: string | null;
        sortOrder: number;
        isCover: boolean;
      }>(
        `
          INSERT INTO landing_core.tb_project_media (
            project_id,
            media_type,
            file_url,
            thumbnail_url,
            title,
            alt_text,
            sort_order,
            is_cover,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 0), COALESCE($8, FALSE), NOW(), NOW())
          RETURNING
            id,
            media_type AS "mediaType",
            file_url AS "fileUrl",
            thumbnail_url AS "thumbnailUrl",
            title,
            alt_text AS "altText",
            sort_order AS "sortOrder",
            is_cover AS "isCover"
        `,
        [
          project.id,
          payload.mediaType,
          payload.fileUrl,
          payload.thumbnailUrl ?? null,
          payload.title ?? null,
          payload.altText ?? null,
          payload.sortOrder ?? 0,
          payload.isCover ?? false,
        ],
        client,
      );

      await this.auditService.log({
        adminUserId: admin.id,
        actionCode: 'projects.media.create',
        entityName: 'tb_project_media',
        entityId: created?.id ?? null,
        description: `Media agregada al proyecto ${project.title}`,
        newData: created as Record<string, unknown>,
        request,
      });

      return created;
    });
  }

  async updateMedia(
    projectPublicId: string,
    mediaId: number,
    payload: UpdateProjectMediaDto,
    admin: CurrentAdmin,
    request: Request,
  ) {
    const project = await this.getProjectIdentity(projectPublicId);
    const existing = await this.databaseService.one<{
      id: number;
      isCover: boolean;
    }>(
      `
        SELECT id, is_cover AS "isCover"
        FROM landing_core.tb_project_media
        WHERE id = $1
          AND project_id = $2
      `,
      [mediaId, project.id],
    );

    if (!existing) {
      throw new NotFoundException(
        'No se encontro el recurso multimedia solicitado.',
      );
    }

    return this.databaseService.transaction(async (client) => {
      if (payload.isCover) {
        await this.clearMediaCover(project.id, client);
      }

      const updateData = buildSetClause(
        {
          media_type: payload.mediaType,
          file_url: payload.fileUrl,
          thumbnail_url: payload.thumbnailUrl,
          title: payload.title,
          alt_text: payload.altText,
          sort_order: payload.sortOrder,
          is_cover: payload.isCover,
          updated_at: new Date(),
        },
        1,
      );

      const updated = await this.databaseService.one<{
        id: number;
        mediaType: string;
        fileUrl: string;
        thumbnailUrl: string | null;
        title: string | null;
        altText: string | null;
        sortOrder: number;
        isCover: boolean;
        updatedAt: string;
      }>(
        `
          UPDATE landing_core.tb_project_media
          SET ${updateData.setClause}
          WHERE id = $${updateData.values.length + 1}
            AND project_id = $${updateData.values.length + 2}
          RETURNING
            id,
            media_type AS "mediaType",
            file_url AS "fileUrl",
            thumbnail_url AS "thumbnailUrl",
            title,
            alt_text AS "altText",
            sort_order AS "sortOrder",
            is_cover AS "isCover",
            updated_at AS "updatedAt"
        `,
        [...updateData.values, mediaId, project.id],
        client,
      );

      await this.auditService.log({
        adminUserId: admin.id,
        actionCode: 'projects.media.update',
        entityName: 'tb_project_media',
        entityId: mediaId,
        description: `Media actualizada en el proyecto ${project.title}`,
        oldData: existing as Record<string, unknown>,
        newData: updated as Record<string, unknown>,
        request,
      });

      return updated;
    });
  }

  private async syncTechnologies(
    projectId: number,
    technologyPublicIds: string[],
    client: PoolClient,
  ) {
    await this.databaseService.query(
      `
        DELETE FROM landing_core.tb_project_technologies
        WHERE project_id = $1
      `,
      [projectId],
      client,
    );

    if (technologyPublicIds.length === 0) {
      return;
    }

    const technologies = await this.databaseService.query<{
      id: number;
      publicId: string;
    }>(
      `
        SELECT id, public_id AS "publicId"
        FROM landing_core.tb_technologies
        WHERE public_id = ANY($1::uuid[])
      `,
      [technologyPublicIds],
      client,
    );

    if (technologies.length !== technologyPublicIds.length) {
      throw new NotFoundException('Una o mas tecnologias enviadas no existen.');
    }

    await Promise.all(
      technologies.map((technology, index) =>
        this.databaseService.query(
          `
            INSERT INTO landing_core.tb_project_technologies (
              project_id,
              technology_id,
              is_primary,
              created_at
            )
            VALUES ($1, $2, $3, NOW())
          `,
          [projectId, technology.id, index === 0],
          client,
        ),
      ),
    );
  }

  private async resolveCategoryId(
    categoryPublicId?: string,
    client?: PoolClient,
  ) {
    if (!categoryPublicId) {
      return null;
    }

    const category = await this.databaseService.one<{ id: number }>(
      `
        SELECT id
        FROM landing_core.tb_project_categories
        WHERE public_id = $1::uuid
      `,
      [categoryPublicId],
      client,
    );

    if (!category) {
      throw new NotFoundException('No se encontro la categoria enviada.');
    }

    return category.id;
  }

  private async getProjectIdentity(publicId: string) {
    const project = await this.databaseService.one<ProjectIdentity>(
      `
        SELECT
          id,
          public_id AS "publicId",
          title,
          slug,
          status,
          published_at AS "publishedAt"
        FROM landing_core.tb_projects
        WHERE public_id = $1::uuid
          AND deleted_at IS NULL
      `,
      [publicId],
    );

    if (!project) {
      throw new NotFoundException('No se encontro el proyecto solicitado.');
    }

    return project;
  }

  private async getProjectForDocumentation(publicId: string) {
    const project = await this.databaseService.one<ProjectForDocumentation>(
      `
        ${this.adminProjectSelect()}
        WHERE p.public_id = $1::uuid
          AND p.deleted_at IS NULL
      `,
      [publicId],
    );

    if (!project) {
      throw new NotFoundException('No se encontro el proyecto solicitado.');
    }

    return project;
  }

  private async generateDocumentationWithOpenAi(
    project: ProjectForDocumentation,
  ): Promise<GeneratedProjectDocumentation> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new BadRequestException(
        'Configura OPENAI_API_KEY en el backend para generar documentacion con OpenAI.',
      );
    }

    if (!project.demoUrl) {
      throw new BadRequestException(
        'El proyecto necesita una URL de demo antes de generar documentacion.',
      );
    }

    const model = this.configService.get<string>('OPENAI_MODEL', 'gpt-5.5');
    let response: Response;

    try {
      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          tools: [{ type: 'web_search' }],
          input: [
            {
              role: 'developer',
              content:
                'Eres estratega de producto y documentacion comercial para Software Easy Dev. Escribes en espanol claro, persuasivo y verificable. Si la URL no se puede analizar, usa solo los datos entregados y dilo de forma honesta sin inventar caracteristicas.',
            },
            {
              role: 'user',
              content: this.buildDocumentationPrompt(project),
            },
          ],
          text: {
            format: this.projectDocumentationSchema(),
          },
        }),
        signal: AbortSignal.timeout(60000),
      });
    } catch {
      throw new BadRequestException(
        'No fue posible conectar con OpenAI. Revisa la clave, el modelo configurado o intenta nuevamente.',
      );
    }

    const payload = (await response
      .json()
      .catch(() => null)) as OpenAiResponsePayload | null;

    if (!response.ok) {
      const message =
        payload?.error?.message ||
        'OpenAI no pudo generar la documentacion del proyecto.';
      throw new BadRequestException(message);
    }

    const outputText = this.extractOpenAiText(payload);

    try {
      return this.normalizeGeneratedDocumentation(JSON.parse(outputText));
    } catch (error) {
      this.logger.error(
        `OpenAI devolvio una respuesta no parseable para ${project.slug}.`,
        error instanceof Error ? error.stack : undefined,
      );
      throw new BadRequestException(
        'OpenAI genero una respuesta inesperada. Intenta nuevamente.',
      );
    }
  }

  private buildDocumentationPrompt(project: ProjectForDocumentation) {
    const technologies = project.technologies
      ?.map((technology) => technology.name)
      .filter(Boolean)
      .join(', ');

    return `
Analiza la URL del proyecto y genera documentacion comercial lista para presentar a un cliente.

URL a analizar: ${project.demoUrl}

Datos actuales del proyecto:
- Titulo: ${project.title}
- Slug: ${project.slug}
- Descripcion corta actual: ${project.shortDescription || 'No registrada'}
- Descripcion completa actual: ${project.fullDescription || 'No registrada'}
- Categoria: ${project.categoryName || 'No registrada'}
- Tecnologias: ${technologies || 'No registradas'}
- Version: ${project.versionLabel || 'No registrada'}
- Cliente/caso actual: ${project.clientName || 'No registrado'}
- Sector actual: ${project.businessSector || 'No registrado'}
- URL de documentacion actual: ${project.documentationUrl || 'No registrada'}

Contexto comercial:
- Software Easy Dev desarrollo esta demo.
- Por ahora KintiPorta es el producto demo principal de Software Easy Dev.
- Si el proyecto analizado es KintiPorta, referencialo como producto principal y explica que convierte una idea de puerta en una solicitud clara para fabricar.
- El contenido debe atraer al cliente: problema que resuelve, valor del demo, flujo de uso, beneficios, posibles casos de uso, preguntas frecuentes y llamado a la accion.
- No menciones informacion tecnica que no puedas inferir de la URL o de los datos del proyecto.

Devuelve JSON valido siguiendo exactamente el esquema solicitado.
`.trim();
  }

  private projectDocumentationSchema() {
    return {
      type: 'json_schema',
      name: 'project_demo_documentation',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: false,
        required: [
          'shortDescription',
          'fullDescription',
          'metaTitle',
          'metaDescription',
          'clientName',
          'businessSector',
          'presentationSummary',
          'sellingPoints',
          'demoFlow',
          'faq',
          'callToAction',
        ],
        properties: {
          shortDescription: {
            type: 'string',
            description:
              'Descripcion comercial de maximo 300 caracteres para cards y listados.',
          },
          fullDescription: {
            type: 'string',
            description:
              'Documentacion comercial extensa en formato Markdown sencillo, sin bloques de codigo.',
          },
          metaTitle: {
            type: 'string',
            description: 'Titulo SEO de maximo 180 caracteres.',
          },
          metaDescription: {
            type: 'string',
            description: 'Descripcion SEO de maximo 300 caracteres.',
          },
          clientName: {
            type: 'string',
            description:
              'Cliente, propietario o caso de referencia. Usa Software Easy Dev si aplica.',
          },
          businessSector: {
            type: 'string',
            description: 'Sector de negocio principal del proyecto.',
          },
          presentationSummary: {
            type: 'string',
            description:
              'Resumen ejecutivo para explicar el demo en una reunion comercial.',
          },
          sellingPoints: {
            type: 'array',
            items: { type: 'string' },
          },
          demoFlow: {
            type: 'array',
            items: { type: 'string' },
          },
          faq: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['question', 'answer'],
              properties: {
                question: { type: 'string' },
                answer: { type: 'string' },
              },
            },
          },
          callToAction: {
            type: 'string',
            description:
              'Llamado a la accion breve para invitar al cliente a solicitar una propuesta.',
          },
        },
      },
    };
  }

  private extractOpenAiText(payload: OpenAiResponsePayload | null) {
    if (payload?.output_text) {
      return payload.output_text;
    }

    const content = payload?.output
      ?.flatMap((item) => item.content ?? [])
      .find((part) => part.text || part.refusal);

    if (content?.refusal) {
      throw new BadRequestException(content.refusal);
    }

    if (content?.text) {
      return content.text;
    }

    throw new BadRequestException(
      'OpenAI no devolvio contenido para la documentacion.',
    );
  }

  private normalizeGeneratedDocumentation(
    value: unknown,
  ): GeneratedProjectDocumentation {
    const draft = value as Partial<GeneratedProjectDocumentation>;

    return {
      shortDescription: this.limitText(draft.shortDescription, 300),
      fullDescription: this.limitText(draft.fullDescription, 8000),
      metaTitle: this.limitText(draft.metaTitle, 180),
      metaDescription: this.limitText(draft.metaDescription, 300),
      clientName: this.limitText(draft.clientName, 150),
      businessSector: this.limitText(draft.businessSector, 120),
      presentationSummary: this.limitText(draft.presentationSummary, 1200),
      sellingPoints: this.normalizeStringArray(draft.sellingPoints),
      demoFlow: this.normalizeStringArray(draft.demoFlow),
      faq: Array.isArray(draft.faq)
        ? draft.faq.slice(0, 6).map((item) => ({
            question: this.limitText(item?.question, 180),
            answer: this.limitText(item?.answer, 500),
          }))
        : [],
      callToAction: this.limitText(draft.callToAction, 500),
    };
  }

  private buildDocumentationProjectPatch(
    project: ProjectForDocumentation,
    draft: GeneratedProjectDocumentation,
  ) {
    return {
      shortDescription: draft.shortDescription || project.shortDescription,
      fullDescription:
        draft.fullDescription ||
        project.fullDescription ||
        project.shortDescription,
      metaTitle: draft.metaTitle || project.metaTitle || project.title,
      metaDescription:
        draft.metaDescription ||
        project.metaDescription ||
        draft.shortDescription ||
        project.shortDescription,
      clientName: draft.clientName || project.clientName || null,
      businessSector: draft.businessSector || project.businessSector || null,
    };
  }

  private normalizeStringArray(value: unknown) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .map((item) => this.limitText(item, 500))
      .filter(Boolean)
      .slice(0, 6);
  }

  private limitText(value: unknown, maxLength: number) {
    if (typeof value !== 'string') {
      return '';
    }

    const trimmed = value.trim();
    return trimmed.length > maxLength ? trimmed.slice(0, maxLength) : trimmed;
  }

  private async clearMediaCover(projectId: number, client: PoolClient) {
    await this.databaseService.query(
      `
        UPDATE landing_core.tb_project_media
        SET is_cover = FALSE, updated_at = NOW()
        WHERE project_id = $1
      `,
      [projectId],
      client,
    );
  }

  private adminProjectSelect(): string {
    return `
      SELECT
        p.id,
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
        p.last_demo_check_at AS "lastDemoCheckAt",
        p.total_project_views AS "totalProjectViews",
        p.total_demo_clicks AS "totalDemoClicks",
        p.total_unique_visitors AS "totalUniqueVisitors",
        p.total_contact_requests AS "totalContactRequests",
        p.meta_title AS "metaTitle",
        p.meta_description AS "metaDescription",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        c.public_id AS "categoryPublicId",
        c.name AS "categoryName",
        c.slug AS "categorySlug",
        creator.public_id AS "createdByPublicId",
        creator.full_name AS "createdByFullName",
        updater.public_id AS "updatedByPublicId",
        updater.full_name AS "updatedByFullName",
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
      LEFT JOIN landing_core.tb_admin_users creator
        ON creator.id = p.created_by
      LEFT JOIN landing_core.tb_admin_users updater
        ON updater.id = p.updated_by
    `;
  }
}
