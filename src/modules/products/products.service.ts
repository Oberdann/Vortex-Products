import { Injectable } from '@nestjs/common';
import { IProductsService } from './contracts/i-products-service';
import { ProductsLisResponseDto } from './dtos/output/product-list-response-dto';
import { ProductResponseDto } from './dtos/output/product-response-dto';
import { PrismaService } from 'src/database/prisma.service';
import { CreateProductDto } from './dtos/input/create-product-dto';
import { UpdateProductDto } from './dtos/input/update-product-dto';
import { ProductMapper } from './mapper/products.mapper';
import { ProductNotFoundException } from './exceptions/product-not-found-exception';
import { ProductNameAlreadyExistsException } from './exceptions/product-name-already-exists-exception';
import { InvalidProductPriceException } from './exceptions/invalid-product-price-exception';
import { InvalidProductStockException } from './exceptions/invalid-product-stock-exception';

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
    const productWithSameName = await this.prisma.product.findFirst({
      where: {
        name: product.name,
      },
    });

    if (productWithSameName) {
      throw new ProductNameAlreadyExistsException(
        'Ja existe um produto com esse nome.',
      );
    }

    if (product.price < 0) {
      throw new InvalidProductPriceException(
        'O preço do produto deve ser maior que zero.',
      );
    }

    if (product.stock < 0) {
      throw new InvalidProductStockException(
        'O estoque do produto não pode ser negativo.',
      );
    }

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

    if (product.name) {
      const productWithSameName = await this.prisma.product.findFirst({
        where: {
          name: product.name,
          NOT: { id },
        },
      });

      if (productWithSameName) {
        throw new ProductNameAlreadyExistsException(
          'Ja existe um produto com esse nome.',
        );
      }
    }

    if (product.price !== undefined && product.price < 0) {
      throw new InvalidProductPriceException(
        'O preço do produto deve ser maior que zero.',
      );
    }

    if (product.stock !== undefined && product.stock < 0) {
      throw new InvalidProductStockException(
        'O estoque do produto não pode ser negativo.',
      );
    }

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
