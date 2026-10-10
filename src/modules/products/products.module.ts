import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { DatabaseModule } from 'src/database/prisma.module';
import { CategoryModule } from '../categories/categories.module';
import { OutboxPublisherService } from './producers/outbox-publisher.service';

@Module({
  imports: [DatabaseModule, CategoryModule],
  controllers: [ProductsController],
  providers: [
    {
      provide: 'IProductsService',
      useClass: ProductsService,
    },
    OutboxPublisherService,
  ],
})
export class ProductModule {}
