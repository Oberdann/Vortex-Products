import { Injectable } from '@nestjs/common';
import { IProductsService } from './contracts/i-products-service';
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

    const response = ProductMapper.toListResponseDto(products);

    return response;
  }

  async getById(id: string): Promise<ProductResponseDto> {
    const product = await this.findProductOrFail(id);

    const response = ProductMapper.toResponseDto(product);

    return response;
  }

  async create(product: CreateProductDto): Promise<ProductResponseDto> {
    const productEntity = {
      name: product.name,
      description: product.description ?? '',
      price: product.price,
      stock: product.stock ?? 1,
      isActive: product.isActive ?? true,
      categories: {
        connect: product.categoryIds?.map((id) => ({ id })) ?? [],
      },
    };

    const createdProduct = await this.prisma.product.create({
      data: productEntity,
    });

    const response = ProductMapper.toResponseDto(createdProduct);

    return response;
  }

  async update(
    id: string,
    product: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const existingProduct = await this.findProductOrFail(id);

    const productEntity = ProductMapper.toPrismaUpdate(
      product,
      existingProduct,
    );

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: productEntity,
      include: { categories: true },
    });

    const response = ProductMapper.toResponseDto(updatedProduct);

    return response;
  }

  async delete(id: string): Promise<void> {
    await this.findProductOrFail(id);

    await this.prisma.product.delete({ where: { id } });
  }

  private async findProductOrFail(id: string, includeCategories = false) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: includeCategories ? { categories: true } : undefined,
    });

    if (!product) {
      throw new ProductNotFoundException(
        `Produto com ID ${id} não encontrado.`,
      );
    }

    return product;
  }
}
