import { Module } from '@nestjs/common';
import { ProductModule } from './modules/products/products.module';

@Module({
  imports: [ProductModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
