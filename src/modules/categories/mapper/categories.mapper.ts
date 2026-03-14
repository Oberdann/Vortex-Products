import { Prisma, Category } from 'generated/prisma/client';
import { CategoryResponseDto } from '../dtos/output/category-response-dto';
import { CreateCategoryDto } from '../dtos/input/create-category-dto';
import { UpdateCategoryDto } from '../dtos/input/update-product-dto';

export class CategoryMapper {
  static toResponseDto(
    this: void,
    category: Category & { products?: { name: string }[] },
  ): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      isActive: category.isActive,
      products: category.products?.map((p) => p.name) ?? [],
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  static toListResponseDto = (
    categories: (Category & { products?: { name: string }[] })[],
  ) => ({
    categories: categories.map(CategoryMapper.toResponseDto),
  });

  static toPrismaCreate(createDto: CreateCategoryDto) {
    return {
      name: createDto.name,
      isActive: createDto.isActive ?? true,
    };
  }

  static toPrismaUpdate(
    updateDto: UpdateCategoryDto,
    existingCategory: Category,
  ): Prisma.CategoryUpdateInput {
    const data: Prisma.CategoryUpdateInput = {
      name: updateDto.name ?? existingCategory.name,
      isActive: updateDto.isActive ?? existingCategory.isActive,
    };

    return data;
  }
}
