import { Inject, Injectable } from '@nestjs/common';
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
import { ICategoriesService } from '../categories/contracts/i-categories-service';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class ProductsService implements IProductsService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly logger: PinoLogger,

    @Inject('ICategoriesService')
    private readonly categoriesService: ICategoriesService,
  ) {}

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
    this.logger.info({ product }, 'Iniciando criação de produto.');

    const productWithSameName = await this.prisma.product.findFirst({
      where: {
        name: product.name,
      },
    });

    if (productWithSameName) {
      this.logger.warn(
        { name: product.name },
        'Tentativa de criar produto com nome duplicado.',
      );

      throw new ProductNameAlreadyExistsException(
        'Ja existe um produto com esse nome.',
      );
    }

    if (product.price < 0) {
      this.logger.warn(
        { name: product.price },
        'Tentativa de criar produto com preço inválido.',
      );

      throw new InvalidProductPriceException(
        'O preço do produto deve ser maior que zero.',
      );
    }

    if (product.stock < 0) {
      this.logger.warn({ stock: product.stock }, 'Estoque inválido informado.');

      throw new InvalidProductStockException(
        'O estoque do produto não pode ser negativo.',
      );
    }

    const productEntity = ProductMapper.toPrismaCreate(product);

    const createdProduct = await this.prisma.product.create({
      data: productEntity,
    });

    this.logger.info(
      { productId: createdProduct.id },
      'Produto criado com sucesso.',
    );

    const response = ProductMapper.toResponseDto(createdProduct);

    return response;
  }

  async update(
    id: string,
    product: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const existingProduct = await this.findProductOrFail(id);

    this.logger.info({ productId: id }, 'Atualizando produto.');

    if (product.name) {
      const productWithSameName = await this.prisma.product.findFirst({
        where: {
          name: product.name,
          NOT: { id },
        },
      });

      if (productWithSameName) {
        this.logger.warn(
          { name: product.name },
          'Tentativa de atualizar produto com nome duplicado.',
        );

        throw new ProductNameAlreadyExistsException(
          'Ja existe um produto com esse nome.',
        );
      }
    }

    if (product.price !== undefined && product.price < 0) {
      this.logger.warn(
        { name: product.name },
        'Tentativa de atualizar produto com preço inválido.',
      );

      throw new InvalidProductPriceException(
        'O preço do produto deve ser maior que zero.',
      );
    }

    if (product.stock !== undefined && product.stock < 0) {
      this.logger.warn(
        { stock: product.stock },
        'Estoque inválido informado ao atulizar produto.',
      );

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

    this.logger.info({ productId: id }, 'Produto atualizado');

    const response = ProductMapper.toResponseDto(updatedProduct);

    return response;
  }

  async addCategoriesToProduct(
    id: string,
    categoriesId: string[],
  ): Promise<ProductResponseDto> {
    await this.findProductOrFail(id);

    this.logger.info({ productId: id }, 'Produto atualizado');

    await Promise.all(
      categoriesId.map((categoryId) =>
        this.categoriesService.getById(categoryId),
      ),
    );

    const productUpdate = await this.prisma.product.update({
      where: { id },
      data: {
        categories: {
          connect: categoriesId.map((categoryId) => ({ id: categoryId })),
        },
      },
      include: { categories: true },
    });

    this.logger.info(
      { productId: id, categoriesId },
      'Adicionando categorias.',
    );

    const response = ProductMapper.toResponseDto(productUpdate);

    return response;
  }

  async removeCategoriesFromProduct(
    id: string,
    categoriesId: string[],
  ): Promise<ProductResponseDto> {
    await this.findProductOrFail(id);

    this.logger.info({ productId: id, categoriesId }, 'Removendo categorias.');

    await Promise.all(
      categoriesId.map((categoryId) =>
        this.categoriesService.getById(categoryId),
      ),
    );

    const productUpdate = await this.prisma.product.update({
      where: { id },
      data: {
        categories: {
          disconnect: categoriesId.map((categoryId) => ({ id: categoryId })),
        },
      },
      include: { categories: true },
    });

    this.logger.info({ productId: id }, 'Categorias removidas.');

    const response = ProductMapper.toResponseDto(productUpdate);

    return response;
  }

  async delete(id: string): Promise<void> {
    await this.findProductOrFail(id);

    this.logger.info({ productId: id }, 'Categorias removidas.');

    await this.prisma.product.delete({ where: { id } });

    this.logger.info({ productId: id }, 'Deletando produto');
  }

  private async findProductOrFail(id: string, includeCategories = false) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: includeCategories ? { categories: true } : undefined,
    });

    if (!product) {
      this.logger.warn({ productId: id }, 'Produto não encontrado.');

      throw new ProductNotFoundException(
        `Produto com ID ${id} não encontrado.`,
      );
    }

    return product;
  }
}
