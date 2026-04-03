import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseService } from './common/database/database.service';

describe('AppController', () => {
  let appController: AppController;

  const configServiceMock = {
    get: (key: string, defaultValue?: string) => {
      const values: Record<string, string> = {
        APP_NAME: 'Landing Softdev API',
        API_PREFIX: 'api',
        SWAGGER_PATH: 'docs',
        SWAGGER_VERSION: '1.0.0',
        NODE_ENV: 'test',
        DB_SSL_ENABLED: 'true',
      };

      return values[key] ?? defaultValue;
    },
  };

  const databaseServiceMock = {
    isConfigured: () => true,
    healthcheck: jest.fn().mockResolvedValue(true),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: configServiceMock,
        },
        {
          provide: DatabaseService,
          useValue: databaseServiceMock,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return api metadata', () => {
      expect(appController.getApiInfo()).toMatchObject({
        appName: 'Landing Softdev API',
        apiPrefix: 'api',
        docsPath: '/docs',
      });
    });

    it('should return backend health', async () => {
      await expect(appController.getHealth()).resolves.toMatchObject({
        status: 'ok',
        environment: 'test',
        databaseStatus: 'connected',
      });
    });
  });
});
