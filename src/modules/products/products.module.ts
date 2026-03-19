import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { DatabaseModule } from 'src/database/prisma.module';
import { CategoryModule } from '../categories/categories.module';

@Module({
  imports: [DatabaseModule, CategoryModule],
  controllers: [ProductsController],
  providers: [
    {
      provide: 'IProductsService',
      useClass: ProductsService,
    },
  ],
})
export class ProductModule {}
