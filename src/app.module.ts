import { Module } from '@nestjs/common';
import { ProductModule } from './modules/products/products.module';
import { CategoryModule } from './modules/categories/categories.module';

@Module({
  imports: [ProductModule, CategoryModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
