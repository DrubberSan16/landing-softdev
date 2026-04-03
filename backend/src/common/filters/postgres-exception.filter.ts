import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';

type PostgresError = Error & {
  code?: string;
  detail?: string;
  column?: string;
  table?: string;
};

@Catch()
export class PostgresExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      response.status(status).json(exception.getResponse());
      return;
    }

    const pgError = exception as PostgresError;

    let mappedError: HttpException;

    switch (pgError.code) {
      case '23505':
        mappedError = new ConflictException(
          pgError.detail ?? 'Registro duplicado.',
        );
        break;
      case '23503':
        mappedError = new NotFoundException(
          pgError.detail ?? 'Relacion referencial no valida.',
        );
        break;
      case '23514':
      case '22P02':
      case '22001':
        mappedError = new BadRequestException(
          pgError.detail ?? pgError.message,
        );
        break;
      default:
        mappedError = new InternalServerErrorException(
          pgError.message ?? 'Ocurrio un error inesperado en la base de datos.',
        );
        break;
    }

    response.status(mappedError.getStatus()).json(mappedError.getResponse());
  }
}
