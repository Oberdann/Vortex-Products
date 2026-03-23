import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { trace } from '@opentelemetry/api';

@Catch(HttpException)
export class ExceptionGlobalFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    const req = host.switchToHttp().getRequest<Request>();

    const span = trace.getActiveSpan();
    const traceId = span?.spanContext().traceId;

    if (exception instanceof HttpException) {
      const status = exception.getStatus();

      const response = exception.getResponse() as
        | { message?: string | string[] }
        | string;

      const message =
        typeof response === 'string'
          ? response
          : response?.message || 'Erro inesperado';

      this.logger.error(
        {
          method: req.method,
          url: req.url,
          status,
          traceId,
          err: {
            message: exception.message,
            stack: exception.stack,
          },
        },
        'Erro HTTP',
      );

      return res.status(status).json({ message, data: [], success: false });
    }

    this.logger.error(
      {
        method: req.method,
        url: req.url,
        traceId,
        err: exception,
      },
      'Erro inesperado',
    );

    return res
      .status(500)
      .json({ message: 'Erro interno do servidor', data: [], success: false });
  }
}
