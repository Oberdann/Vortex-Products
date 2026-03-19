import { PrismaService } from 'src/database/prisma.service';
import { ICategoriesService } from './contracts/i-categories-service';
import { CreateCategoryDto } from './dtos/input/create-category-dto';
import { UpdateCategoryDto } from './dtos/input/update-category-dto';
import { CategoriesLisResponseDto } from './dtos/output/category-list-response-dto';
import { CategoryResponseDto } from './dtos/output/category-response-dto';
import { Injectable } from '@nestjs/common';
import { CategoryNotFoundException } from './exceptions/category-not-found-exception';
import { CategoryMapper } from './mapper/categories.mapper';
import { CategoryNameAlreadyExistsException } from './exceptions/category-name-already-exists-exception';

@Injectable()
export class CategoriesService implements ICategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<CategoriesLisResponseDto> {
    const categories = await this.prisma.category.findMany({
      select: {
        id: true,
        name: true,
        isActive: true,
        products: {
          select: { id: true, name: true },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    const response = CategoryMapper.toListResponseDto(categories);

    return response;
  }

  async getById(id: string): Promise<CategoryResponseDto> {
    const category = await this.findCategoryOrFail(id);

    const response = CategoryMapper.toResponseDto(category);

    return response;
  }

  async getProductsByCategory(id: string): Promise<CategoryResponseDto> {
    const productsByCategory = await this.findCategoryOrFail(id, true);

    const response = CategoryMapper.toResponseDto(productsByCategory);

    return response;
  }

  async create(category: CreateCategoryDto): Promise<CategoryResponseDto> {
    const categorytWithSameName = await this.prisma.category.findFirst({
      where: {
        name: category.name,
      },
    });

    if (categorytWithSameName) {
      throw new CategoryNameAlreadyExistsException(
        'Ja existe uma categoria com esse nome.',
      );
    }

    const createdCategory = await this.prisma.category.create({
      data: category,
    });

    const response = CategoryMapper.toResponseDto(createdCategory);

    return response;
  }

  async update(
    id: string,
    updateDto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    const existingCategory = await this.findCategoryOrFail(id);

    if (updateDto.name) {
      const categorytWithSameName = await this.prisma.category.findFirst({
        where: {
          name: updateDto.name,
          NOT: { id },
        },
      });

      if (categorytWithSameName) {
        throw new CategoryNameAlreadyExistsException(
          'Ja existe uma categoria com esse nome.',
        );
      }
    }

    const updateData = CategoryMapper.toPrismaUpdate(
      updateDto,
      existingCategory,
    );

    const updatedCategory = await this.prisma.category.update({
      where: { id },
      data: updateData,
    });

    const response = CategoryMapper.toResponseDto(updatedCategory);

    return response;
  }

  async delete(id: string): Promise<void> {
    await this.findCategoryOrFail(id);

    await this.prisma.category.delete({
      where: { id },
    });
  }

  private async findCategoryOrFail(id: string, includeProducts = false) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: includeProducts
        ? {
            products: {
              where: {
                isActive: true,
              },
            },
          }
        : undefined,
    });

    if (!category) {
      throw new CategoryNotFoundException(
        `Categoria com ID ${id} não encontrada.`,
      );
    }

    return category;
  }
}
