import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentAdminUser } from '../../../common/decorators/current-admin.decorator';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { ContactQueryDto } from './dto/contact-query.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { ContactsService } from './contacts.service';
import type { Request } from 'express';
import type { CurrentAdmin } from '../../../common/interfaces/current-admin.interface';

@ApiTags('Admin Contacts')
@ApiBearerAuth('session-token')
@UseGuards(SessionAuthGuard)
@Controller('admin/contact-requests')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @RequirePermissions('contacts.read')
  @ApiOperation({ summary: 'Listar leads y solicitudes de contacto' })
  list(@Query() query: ContactQueryDto) {
    return this.contactsService.list(query);
  }

  @Get(':publicId')
  @RequirePermissions('contacts.read')
  @ApiOperation({ summary: 'Obtener detalle de un lead' })
  findOne(@Param('publicId') publicId: string) {
    return this.contactsService.findOne(publicId);
  }

  @Patch(':publicId')
  @RequirePermissions('contacts.update')
  @ApiOperation({ summary: 'Actualizar seguimiento de un lead' })
  update(
    @Param('publicId') publicId: string,
    @Body() payload: UpdateContactDto,
    @CurrentAdminUser() admin: CurrentAdmin,
    @Req() request: Request,
  ) {
    return this.contactsService.update(publicId, payload, admin, request);
  }
}
