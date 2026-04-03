import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from './common/database/database.service';
import { ApiInfoResponseDto } from './shared/dto/api-info-response.dto';
import { HealthResponseDto } from './shared/dto/health-response.dto';

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService,
    private readonly databaseService: DatabaseService,
  ) {}

  getApiInfo(): ApiInfoResponseDto {
    const appName = this.configService.get<string>(
      'APP_NAME',
      'Landing Softdev API',
    );
    const apiPrefix = this.configService.get<string>('API_PREFIX', 'api');
    const swaggerPath = this.configService.get<string>('SWAGGER_PATH', 'docs');
    const swaggerVersion = this.configService.get<string>(
      'SWAGGER_VERSION',
      '1.0.0',
    );

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

  async getHealth(): Promise<HealthResponseDto> {
    const dbConfigured = this.databaseService.isConfigured();
    const sslEnabled =
      this.configService.get<string>('DB_SSL_ENABLED', 'true') === 'true';
    let databaseStatus = dbConfigured ? 'configured' : 'missing_configuration';

    if (dbConfigured) {
      try {
        await this.databaseService.healthcheck();
        databaseStatus = 'connected';
      } catch {
        databaseStatus = 'unavailable';
      }
    }

    return {
      status: 'ok',
      appName: this.configService.get<string>(
        'APP_NAME',
        'Landing Softdev API',
      ),
      environment: this.configService.get<string>('NODE_ENV', 'development'),
      apiPrefix: this.configService.get<string>('API_PREFIX', 'api'),
      databaseStatus,
      databaseSslEnabled: sslEnabled,
      timestamp: new Date().toISOString(),
    };
  }
}
