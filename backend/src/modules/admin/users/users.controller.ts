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
  CreateUserDto,
  UpdateUserDto,
  UpdateUserRolesDto,
} from './dto/upsert-user.dto';
import { UserQueryDto } from './dto/user-query.dto';
import { UsersService } from './users.service';
import type { Request } from 'express';
import type { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';

@ApiTags('Admin Users')
@ApiBearerAuth('session-token')
@UseGuards(SessionAuthGuard)
@Controller('admin/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('admin_users.manage')
  @ApiOperation({ summary: 'Listar usuarios administrativos' })
  list(@Query() query: UserQueryDto) {
    return this.usersService.list(query);
  }

  @Get(':publicId')
  @RequirePermissions('admin_users.manage')
  @ApiOperation({ summary: 'Obtener detalle de un usuario administrativo' })
  findOne(@Param('publicId') publicId: string) {
    return this.usersService.findOne(publicId);
  }

  @Post()
  @RequirePermissions('admin_users.manage')
  @ApiOperation({ summary: 'Crear un usuario administrativo' })
  create(
    @Body() payload: CreateUserDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.usersService.create(payload, admin, request);
  }

  @Patch(':publicId')
  @RequirePermissions('admin_users.manage')
  @ApiOperation({ summary: 'Actualizar un usuario administrativo' })
  update(
    @Param('publicId') publicId: string,
    @Body() payload: UpdateUserDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.usersService.update(publicId, payload, admin, request);
  }

  @Patch(':publicId/roles')
  @RequirePermissions('admin_users.manage')
  @ApiOperation({ summary: 'Actualizar roles de un usuario administrativo' })
  updateRoles(
    @Param('publicId') publicId: string,
    @Body() payload: UpdateUserRolesDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.usersService.updateRoles(publicId, payload, admin, request);
  }
}
