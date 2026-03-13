import { Prisma, Product } from 'generated/prisma/client';
import { ProductResponseDto } from '../dtos/output/product-response-dto';
import { CreateProductDto } from '../dtos/input/create-product-dto';
import { UpdateProductDto } from '../dtos/input/update-product-dto';

export class ProductMapper {
  static toResponseDto(
    this: void,
    product: Product & { categories?: { id: string; name: string }[] },
  ): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: Number(product.price),
      stock: product.stock,
      isActive: product.isActive,
      categories: product.categories?.map((cat) => ({ name: cat.name })) ?? [],
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }

  static toListResponseDto = (
    products: (Product & { categories?: { id: string; name: string }[] })[],
  ) => ({
    products: products.map(ProductMapper.toResponseDto),
  });

  static toPrismaCreate(createDto: CreateProductDto) {
    return {
      name: createDto.name,
      description: createDto.description ?? '',
      price: createDto.price,
      stock: createDto.stock ?? 1,
      isActive: createDto.isActive ?? true,
      categories: {
        connect: createDto.categoryIds?.map((id) => ({ id })) ?? [],
      },
    };
  }

  static toPrismaUpdate(
    updateDto: UpdateProductDto,
    existingProduct: Product,
  ): Prisma.ProductUpdateInput {
    const data: Prisma.ProductUpdateInput = {
      name: updateDto.name ?? existingProduct.name,
      description: updateDto.description ?? existingProduct.description,
      price: updateDto.price ?? existingProduct.price,
      stock: updateDto.stock ?? existingProduct.stock,
      isActive: updateDto.isActive ?? existingProduct.isActive,
    };

    if (updateDto.categoryIds) {
      data.categories = {
        set: updateDto.categoryIds.map((id) => ({ id })),
      };
    }

    return data;
  }
}
