import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

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
      };

      return values[key] ?? defaultValue;
    },
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

    it('should return backend health', () => {
      expect(appController.getHealth()).toMatchObject({
        status: 'ok',
        environment: 'test',
      });
    });
  });
});
