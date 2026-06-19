import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdminUser } from '../../../common/decorators/current-admin.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { CreateRoleDto, UpdateRoleDto } from './dto/upsert-role.dto';
import { RolesService } from './roles.service';
import type { Request } from 'express';
import type { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';

@ApiTags('Admin Roles')
@ApiBearerAuth('session-token')
@UseGuards(SessionAuthGuard)
@Controller('admin/roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @RequirePermissions('admin_users.manage')
  @ApiOperation({ summary: 'Listar roles administrativos con sus permisos' })
  listRoles() {
    return this.rolesService.listRoles();
  }

  @Get('permissions')
  @RequirePermissions('admin_users.manage')
  @ApiOperation({ summary: 'Listar permisos disponibles' })
  listPermissions() {
    return this.rolesService.listPermissions();
  }

  @Post()
  @RequirePermissions('admin_users.manage')
  @ApiOperation({ summary: 'Crear un rol administrativo personalizado' })
  create(
    @Body() payload: CreateRoleDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.rolesService.create(payload, admin, request);
  }

  @Patch(':code')
  @RequirePermissions('admin_users.manage')
  @ApiOperation({ summary: 'Actualizar un rol administrativo personalizado' })
  update(
    @Param('code') code: string,
    @Body() payload: UpdateRoleDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.rolesService.update(code, payload, admin, request);
  }

  @Delete(':code')
  @RequirePermissions('admin_users.manage')
  @ApiOperation({ summary: 'Eliminar un rol administrativo personalizado' })
  remove(
    @Param('code') code: string,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.rolesService.remove(code, admin, request);
  }
}
