import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/database/prisma.module';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';

@Module({
  imports: [DatabaseModule],
  controllers: [CategoriesController],
  providers: [
    {
      provide: 'ICategoriesService',
      useClass: CategoriesService,
    },
  ],
  exports: ['ICategoriesService'],
})
export class CategoryModule {}
