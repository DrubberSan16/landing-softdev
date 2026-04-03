import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiInfoResponseDto } from './shared/dto/api-info-response.dto';
import { HealthResponseDto } from './shared/dto/health-response.dto';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getApiInfo(): ApiInfoResponseDto {
    const appName = this.configService.get<string>('APP_NAME', 'Landing Softdev API');
    const apiPrefix = this.configService.get<string>('API_PREFIX', 'api');
    const swaggerPath = this.configService.get<string>('SWAGGER_PATH', 'docs');
    const swaggerVersion = this.configService.get<string>('SWAGGER_VERSION', '1.0.0');

    return {
      appName,
      description: 'Base API para una landing desacoplada y lista para crecer.',
      version: swaggerVersion,
      apiPrefix,
      docsPath: `/${swaggerPath}`,
      healthPath: `/${apiPrefix}/health`,
      timestamp: new Date().toISOString(),
    };
  }

  getHealth(): HealthResponseDto {
    return {
      status: 'ok',
      appName: this.configService.get<string>('APP_NAME', 'Landing Softdev API'),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      apiPrefix: this.configService.get<string>('API_PREFIX', 'api'),
      timestamp: new Date().toISOString(),
    };
  }
}
