import { BadRequestException, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { extname, resolve } from 'path';

const imageTypes = {
  'image/jpeg': {
    extension: '.jpg',
    isValid: (buffer: Buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  'image/png': {
    extension: '.png',
    isValid: (buffer: Buffer) =>
      buffer.length >= 8 &&
      buffer
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  },
  'image/webp': {
    extension: '.webp',
    isValid: (buffer: Buffer) =>
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP',
  },
} as const;

export const PROJECT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;
export const PROJECT_IMAGE_MIME_TYPES = Object.keys(imageTypes);

export function getProjectUploadDirectory(): string {
  return resolve(process.env.UPLOAD_DIR || 'uploads/projects');
}

export async function saveProjectImage(
  file: Express.Multer.File | undefined,
): Promise<string> {
  if (!file) {
    throw new BadRequestException('Selecciona una imagen para subir.');
  }

  const imageType = imageTypes[file.mimetype as keyof typeof imageTypes];

  if (!imageType || !imageType.isValid(file.buffer)) {
    throw new BadRequestException(
      'El archivo debe ser una imagen JPEG, PNG o WebP valida.',
    );
  }

  const directory = getProjectUploadDirectory();
  const filename = `${randomUUID()}${imageType.extension}`;
  await mkdir(directory, { recursive: true });
  await writeFile(resolve(directory, filename), file.buffer, { flag: 'wx' });
  return filename;
}

export async function readProjectImage(filename: string): Promise<{
  buffer: Buffer;
  contentType: string;
}> {
  if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/i.test(filename)) {
    throw new NotFoundException('No se encontro la imagen solicitada.');
  }

  try {
    const buffer = await readFile(
      resolve(getProjectUploadDirectory(), filename),
    );
    const extension = extname(filename).toLowerCase();
    const contentType =
      extension === '.png'
        ? 'image/png'
        : extension === '.webp'
          ? 'image/webp'
          : 'image/jpeg';

    return { buffer, contentType };
  } catch {
    throw new NotFoundException('No se encontro la imagen solicitada.');
  }
}
