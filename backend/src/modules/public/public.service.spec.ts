import { Logger } from '@nestjs/common';
import { DatabaseService } from '../../common/database/database.service';
import { PublicService } from './public.service';

describe('PublicService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const project = {
    id: 7,
    publicId: '79bc2a9c-33bb-4b3e-8440-0e536ba5cb4d',
    slug: 'k',
    title: 'KINTIPORTA',
    demoUrl: 'https://kintiporta.softwareeasydev.com',
  };

  it('redirects to the configured demo when click tracking fails', async () => {
    const one = jest
      .fn()
      .mockResolvedValueOnce(project)
      .mockRejectedValueOnce(
        new Error('No existe una sesion para el session_token enviado'),
      );
    const service = new PublicService({ one } as unknown as DatabaseService);
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    await expect(
      service.resolveDemoRedirect(
        project.slug,
        '88744eeb-dc88-4787-ac99-490e7d5e2e74',
        'https://softwareeasydev.com/proyectos/k',
      ),
    ).resolves.toBe(project.demoUrl);
  });
});
