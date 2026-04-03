import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './config/app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');
  const { port, apiPrefix, swaggerPath } = configureApp(app);

  await app.listen(port);

  logger.log(`Backend listo en http://localhost:${port}/${apiPrefix}`);
  logger.log(`Swagger disponible en http://localhost:${port}/${swaggerPath}`);
}

void bootstrap();
