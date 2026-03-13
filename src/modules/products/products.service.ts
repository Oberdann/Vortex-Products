import { Injectable } from '@nestjs/common';
import { IProductsService } from './contracts/products-service-use-case';
import { ProductsLisResponseDto } from './dtos/output/product-list-response-dto';
import { ProductResponseDto } from './dtos/output/product-response-dto';
import { PrismaService } from 'src/database/prisma.service';
import { CreateProductDto } from './dtos/input/create-product-dto';
import { UpdateProductDto } from './dtos/input/update-product-dto';
import { ProductMapper } from './mapper/products.mapper';
import { ProductNotFoundException } from './exceptions/product-not-found-exception';

@Injectable()
export class ProductsService implements IProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(): Promise<ProductsLisResponseDto> {
    const products = await this.prisma.product.findMany({
      include: { categories: true },
    });

    return ProductMapper.toListResponseDto(products);
  }

  async getById(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new ProductNotFoundException(
        `O produto com ID ${id} não foi encontrado.`,
      );
    }

    return ProductMapper.toResponseDto(product);
  }

  async create(product: CreateProductDto): Promise<ProductResponseDto> {
    const productEntity = {
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      stock: product.stock ?? 1,
      isActive: product.isActive ?? true,
    };

    const createdProduct = await this.prisma.product.create({
      data: productEntity,
    });

    return ProductMapper.toResponseDto(createdProduct);
  }

  async update(
    id: string,
    product: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      throw new ProductNotFoundException(
        `O produto com ID ${id} não foi encontrado.`,
      );
    }

    const productEntity = {
      name: product.name ?? existingProduct.name,
      description: product.description ?? existingProduct.description,
      price: product.price ?? existingProduct.price,
      stock: product.stock ?? existingProduct.stock,
      isActive: product.isActive ?? existingProduct.isActive,
    };

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: productEntity,
    });

    return ProductMapper.toResponseDto(updatedProduct);
  }

  async delete(id: string): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id } });

    if (!product) {
      throw new ProductNotFoundException(
        `Produto com id ${id} não encontrado.`,
      );
    }

    await this.prisma.product.delete({ where: { id } });
  }
}
