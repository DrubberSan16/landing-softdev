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
import { TechnologiesService } from './technologies.service';
import {
  CreateTechnologyDto,
  TechnologyListQueryDto,
  UpdateTechnologyDto,
} from './dto/upsert-technology.dto';
import type { Request } from 'express';
import type { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';

@ApiTags('Admin Technologies')
@ApiBearerAuth('session-token')
@UseGuards(SessionAuthGuard)
@Controller('admin/technologies')
export class TechnologiesController {
  constructor(private readonly technologiesService: TechnologiesService) {}

  @Get()
  @RequirePermissions('technologies.manage')
  @ApiOperation({ summary: 'Listar tecnologias administrativas' })
  list(@Query() query: TechnologyListQueryDto) {
    return this.technologiesService.list(query);
  }

  @Post()
  @RequirePermissions('technologies.manage')
  @ApiOperation({ summary: 'Crear una tecnologia' })
  create(
    @Body() payload: CreateTechnologyDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.technologiesService.create(payload, admin, request);
  }

  @Patch(':publicId')
  @RequirePermissions('technologies.manage')
  @ApiOperation({ summary: 'Actualizar una tecnologia' })
  update(
    @Param('publicId') publicId: string,
    @Body() payload: UpdateTechnologyDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.technologiesService.update(publicId, payload, admin, request);
  }
}
