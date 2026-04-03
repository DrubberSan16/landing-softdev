import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdminUser } from '../../../common/decorators/current-admin.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
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
  constructor(private readonly projectsService: ProjectsService) {}

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
