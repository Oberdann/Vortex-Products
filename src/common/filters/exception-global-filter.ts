import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class ExceptionGlobalFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();

    const status = exception.getStatus();

    const response = exception.getResponse() as
      | { message?: string | string[] }
      | string;

    const message =
      typeof response === 'string'
        ? response
        : response?.message || 'Erro inesperado';

    res.status(status).json({ message, data: [], success: false });
  }
}
