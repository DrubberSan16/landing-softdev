import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { AuditQueryDto } from './dto/audit-query.dto';
import { AuditService } from './audit.service';

@ApiTags('Admin Audit')
@ApiBearerAuth('session-token')
@UseGuards(SessionAuthGuard)
@Controller('admin/audit-logs')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('admin_users.manage')
  @ApiOperation({ summary: 'Listar auditoria administrativa' })
  list(@Query() query: AuditQueryDto) {
    return this.auditService.list(query);
  }
}
