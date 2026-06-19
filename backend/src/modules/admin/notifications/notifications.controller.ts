import {
  Body,
  Controller,
  Delete,
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
  NotificationPreferenceQueryDto,
  NotificationQueueQueryDto,
} from './dto/notification-query.dto';
import {
  UpdateNotificationPreferenceDto,
  UpdateNotificationQueueDto,
} from './dto/update-notification.dto';
import {
  CreateNotificationChannelDto,
  CreateNotificationTemplateDto,
  UpdateNotificationChannelDto,
  UpdateNotificationTemplateDto,
} from './dto/upsert-notification-config.dto';
import { NotificationsService } from './notifications.service';
import type { Request } from 'express';
import type { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';

@ApiTags('Admin Notifications')
@ApiBearerAuth('session-token')
@UseGuards(SessionAuthGuard)
@Controller('admin/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('queue')
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Listar cola de notificaciones' })
  listQueue(@Query() query: NotificationQueueQueryDto) {
    return this.notificationsService.listQueue(query);
  }

  @Get('channels')
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Listar canales de notificacion' })
  listChannels() {
    return this.notificationsService.listChannels();
  }

  @Get('templates')
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Listar plantillas de notificacion' })
  listTemplates() {
    return this.notificationsService.listTemplates();
  }

  @Get('preferences')
  @RequirePermissions('notifications.manage')
  @ApiOperation({
    summary: 'Listar preferencias de notificacion por administrador',
  })
  listPreferences(@Query() query: NotificationPreferenceQueryDto) {
    return this.notificationsService.listPreferences(query);
  }

  @Post('channels')
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Crear un canal de notificacion' })
  createChannel(
    @Body() payload: CreateNotificationChannelDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.notificationsService.createChannel(payload, admin, request);
  }

  @Patch('channels/:id')
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Actualizar un canal de notificacion' })
  updateChannel(
    @Param('id') id: string,
    @Body() payload: UpdateNotificationChannelDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.notificationsService.updateChannel(
      Number(id),
      payload,
      admin,
      request,
    );
  }

  @Delete('channels/:id')
  @RequirePermissions('notifications.manage')
  @ApiOperation({
    summary: 'Eliminar un canal de notificacion sin dependencias',
  })
  removeChannel(
    @Param('id') id: string,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.notificationsService.removeChannel(Number(id), admin, request);
  }

  @Post('templates')
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Crear una plantilla de notificacion' })
  createTemplate(
    @Body() payload: CreateNotificationTemplateDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.notificationsService.createTemplate(payload, admin, request);
  }

  @Patch('templates/:id')
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Actualizar una plantilla de notificacion' })
  updateTemplate(
    @Param('id') id: string,
    @Body() payload: UpdateNotificationTemplateDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.notificationsService.updateTemplate(
      Number(id),
      payload,
      admin,
      request,
    );
  }

  @Delete('templates/:id')
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Eliminar una plantilla de notificacion' })
  removeTemplate(
    @Param('id') id: string,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.notificationsService.removeTemplate(Number(id), admin, request);
  }

  @Patch('queue/:id')
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Actualizar estado de un item de cola' })
  updateQueueItem(
    @Param('id') id: string,
    @Body() payload: UpdateNotificationQueueDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.notificationsService.updateQueueItem(
      Number(id),
      payload,
      admin,
      request,
    );
  }

  @Patch('preferences/:id')
  @RequirePermissions('notifications.manage')
  @ApiOperation({ summary: 'Actualizar una preferencia de notificacion' })
  updatePreference(
    @Param('id') id: string,
    @Body() payload: UpdateNotificationPreferenceDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.notificationsService.updatePreference(
      Number(id),
      payload,
      admin,
      request,
    );
  }
}
