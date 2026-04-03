import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { ApiInfoResponseDto } from './shared/dto/api-info-response.dto';
import { HealthResponseDto } from './shared/dto/health-response.dto';

@ApiTags('system')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener la metadata base de la API' })
  @ApiOkResponse({ type: ApiInfoResponseDto })
  getApiInfo(): ApiInfoResponseDto {
    return this.appService.getApiInfo();
  }

  @Get('health')
  @ApiOperation({ summary: 'Verificar el estado del backend' })
  @ApiOkResponse({ type: HealthResponseDto })
  async getHealth(): Promise<HealthResponseDto> {
    return this.appService.getHealth();
  }
}
