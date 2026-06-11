import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { PostgresExceptionFilter } from '../common/filters/postgres-exception.filter';

type RuntimeConfig = {
  apiPrefix: string;
  port: number;
  swaggerPath: string;
};

function getAllowedOrigins(frontendUrl: string, nodeEnv: string): string[] {
  const configuredOrigins = frontendUrl
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (nodeEnv === 'production') {
    return configuredOrigins;
  }

  return Array.from(
    new Set([
      ...configuredOrigins,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ]),
  );
}

export function configureApp(app: INestApplication): RuntimeConfig {
  const configService = app.get(ConfigService);

  const appName = configService.get<string>('APP_NAME', 'Landing Softdev API');
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const apiPrefix = configService.get<string>('API_PREFIX', 'api');
  const port = Number(configService.get<string>('PORT', '3000'));
  const swaggerPath = configService.get<string>('SWAGGER_PATH', 'docs');
  const swaggerTitle = configService.get<string>('SWAGGER_TITLE', appName);
  const swaggerDescription = configService.get<string>(
    'SWAGGER_DESCRIPTION',
    'Documentacion base para la landing y futuras APIs.',
  );
  const swaggerVersion = configService.get<string>('SWAGGER_VERSION', '1.0.0');
  const frontendUrl = configService.get<string>(
    'FRONTEND_URL',
    'http://localhost:5173',
  );

  const allowedOrigins = getAllowedOrigins(frontendUrl, nodeEnv);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  app.setGlobalPrefix(apiPrefix);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new PostgresExceptionFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion(swaggerVersion)
    .addServer(`http://localhost:${port}/${apiPrefix}`)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Session',
        description: 'Bearer token emitido por /admin/auth/login',
      },
      'session-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document, {
    customSiteTitle: `${appName} Docs`,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  return {
    apiPrefix,
    port,
    swaggerPath,
  };
}
