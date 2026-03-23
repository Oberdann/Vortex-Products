import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import {
  httpRequestsTotal,
  httpRequestDuration,
} from '../../config/prometheus-config';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();

    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - start) / 1000;

        const route = req.route?.path || req.url;
        const method = req.method;
        const status = res.statusCode;

        httpRequestsTotal.inc({ method, route, status });
        httpRequestDuration.observe({ method, route, status }, duration);
      }),
    );
  }
}
