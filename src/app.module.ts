import { Module } from '@nestjs/common';
import { ProductModule } from './modules/products/products.module';
import { CategoryModule } from './modules/categories/categories.module';
import { LoggerModule } from 'nestjs-pino';
import { loggerConfig } from './config/pino-module-config';
import { ExceptionGlobalFilter } from './common/filters/exception-global-filter';
import { APP_FILTER } from '@nestjs/core';
import { MetricsModule } from './observability/metrics/metrics.module';

@Module({
  imports: [
    LoggerModule.forRoot(loggerConfig),
    MetricsModule,
    ProductModule,
    CategoryModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_FILTER,
      useClass: ExceptionGlobalFilter,
    },
  ],
})
export class AppModule {}
