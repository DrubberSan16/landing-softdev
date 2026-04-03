import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';
import { SessionAuthGuard } from '../auth/session-auth.guard';
import { DailyMetricsQueryDto } from './dto/metrics-query.dto';
import { MetricsService } from './metrics.service';

@ApiTags('Admin Metrics')
@ApiBearerAuth('session-token')
@UseGuards(SessionAuthGuard)
@Controller('admin/metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get('site')
  @RequirePermissions('analytics.read')
  @ApiOperation({ summary: 'Obtener metricas generales del sitio' })
  getSiteMetrics() {
    return this.metricsService.getSiteMetrics();
  }

  @Get('projects')
  @RequirePermissions('analytics.read')
  @ApiOperation({ summary: 'Obtener metricas agregadas por proyecto' })
  getProjectMetrics() {
    return this.metricsService.getProjectMetrics();
  }

  @Get('top-demo-clicks')
  @RequirePermissions('analytics.read')
  @ApiOperation({ summary: 'Obtener el top de demos por clicks' })
  getTopDemoClicks() {
    return this.metricsService.getTopDemoClicks();
  }

  @Get('daily-demo-clicks')
  @RequirePermissions('analytics.read')
  @ApiOperation({ summary: 'Obtener clicks diarios a demos' })
  getDailyDemoClicks(@Query() query: DailyMetricsQueryDto) {
    return this.metricsService.getDailyDemoClicks(query);
  }
}
