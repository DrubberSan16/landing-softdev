import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { RolesService } from './roles.service';

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
}
