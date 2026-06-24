import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import { CurrentAdminUser } from '../../../common/decorators/current-admin.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import {
  PROJECT_IMAGE_MAX_BYTES,
  PROJECT_IMAGE_MIME_TYPES,
  saveProjectImage,
} from '../../../common/uploads/project-image-upload.util';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import {
  CreateProjectMediaDto,
  UpdateProjectMediaDto,
} from './dto/project-media.dto';
import { ProjectQueryDto } from './dto/project-query.dto';
import { CreateProjectDto, UpdateProjectDto } from './dto/upsert-project.dto';
import { ProjectsService } from './projects.service';
import type { Request } from 'express';
import type { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';

@ApiTags('Admin Projects')
@ApiBearerAuth('session-token')
@UseGuards(SessionAuthGuard)
@Controller('admin/projects')
export class ProjectsController {
  constructor(
    private readonly projectsService: ProjectsService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'Listar proyectos demo del panel' })
  list(@Query() query: ProjectQueryDto) {
    return this.projectsService.list(query);
  }

  @Get(':publicId')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'Obtener detalle administrativo de un proyecto' })
  findOne(@Param('publicId') publicId: string) {
    return this.projectsService.findOne(publicId);
  }

  @Post()
  @RequirePermissions('projects.create')
  @ApiOperation({ summary: 'Crear un proyecto demo' })
  create(
    @Body() payload: CreateProjectDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.projectsService.create(payload, admin, request);
  }

  @Post(':publicId/ai-documentation')
  @RequirePermissions('projects.update')
  @ApiOperation({
    summary: 'Generar un borrador de documentacion comercial con OpenAI',
  })
  generateDocumentationDraft(
    @Param('publicId') publicId: string,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.projectsService.generateDocumentationDraft(
      publicId,
      admin,
      request,
    );
  }

  @Post('uploads/cover')
  @RequirePermissions('projects.create')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: { fileSize: PROJECT_IMAGE_MAX_BYTES, files: 1 },
      fileFilter: (_request, file, callback) => {
        if (!PROJECT_IMAGE_MIME_TYPES.includes(file.mimetype)) {
          callback(
            new BadRequestException(
              'El archivo debe ser una imagen JPEG, PNG o WebP.',
            ),
            false,
          );
          return;
        }

        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        image: { type: 'string', format: 'binary' },
      },
      required: ['image'],
    },
  })
  @ApiOperation({ summary: 'Subir imagen principal de un proyecto' })
  async uploadCover(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Req() request: Request,
  ) {
    const filename = await saveProjectImage(file);
    const forwardedProtocol = request.headers['x-forwarded-proto'];
    const protocol = Array.isArray(forwardedProtocol)
      ? forwardedProtocol[0]
      : forwardedProtocol?.split(',')[0]?.trim() || request.protocol;
    const host = request.get('host');
    const apiPrefix = this.configService.get<string>('API_PREFIX', 'api');

    return {
      filename,
      url: `${protocol}://${host}/${apiPrefix}/public/uploads/projects/${filename}`,
    };
  }

  @Patch(':publicId')
  @RequirePermissions('projects.update')
  @ApiOperation({ summary: 'Actualizar un proyecto demo' })
  update(
    @Param('publicId') publicId: string,
    @Body() payload: UpdateProjectDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.projectsService.update(publicId, payload, admin, request);
  }

  @Delete(':publicId')
  @RequirePermissions('projects.delete')
  @ApiOperation({ summary: 'Eliminar logicamente un proyecto demo' })
  remove(
    @Param('publicId') publicId: string,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.projectsService.remove(publicId, admin, request);
  }

  @Get(':publicId/media')
  @RequirePermissions('projects.read')
  @ApiOperation({ summary: 'Listar medios de un proyecto' })
  listMedia(@Param('publicId') publicId: string) {
    return this.projectsService.listMedia(publicId);
  }

  @Post(':publicId/media')
  @RequirePermissions('projects.update')
  @ApiOperation({ summary: 'Agregar un medio a un proyecto' })
  createMedia(
    @Param('publicId') publicId: string,
    @Body() payload: CreateProjectMediaDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.projectsService.createMedia(publicId, payload, admin, request);
  }

  @Patch(':publicId/media/:mediaId')
  @RequirePermissions('projects.update')
  @ApiOperation({ summary: 'Actualizar un medio de un proyecto' })
  updateMedia(
    @Param('publicId') publicId: string,
    @Param('mediaId') mediaId: string,
    @Body() payload: UpdateProjectMediaDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.projectsService.updateMedia(
      publicId,
      Number(mediaId),
      payload,
      admin,
      request,
    );
  }
}
