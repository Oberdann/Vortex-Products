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
import { ICategoriesService } from '../categories/contracts/i-categories-service';
import { PinoLogger } from 'nestjs-pino';
import { PRODUCT_DELETED_EVENT } from 'src/common/messaging/rabbitmq-topology';

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
    const product = await this.findProductOrFail(id, true);

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

    if (product.price < 0.01) {
      this.logger.warn(
        { name: product.price },
        'Tentativa de criar produto com preço inválido.',
      );

      throw new InvalidProductPriceException(
        'O preço do produto deve ser maior que zero.',
      );
    }

    await this.validateCategoriesExist(product.categoryIds);

    const productEntity = ProductMapper.toPrismaCreate(product);

    const createdProduct = await this.prisma.$transaction(
      async (transaction) => {
        const created = await transaction.product.create({
          data: productEntity,
          include: { categories: true },
        });

        await transaction.outboxEvent.create({
          data: {
            aggregateId: created.id,
            eventType: 'product.created',
            payload: { productId: created.id },
          },
        });

        return created;
      },
    );

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

    if (product.price !== undefined && product.price < 0.01) {
      this.logger.warn(
        { name: product.name },
        'Tentativa de atualizar produto com preço inválido.',
      );

      throw new InvalidProductPriceException(
        'O preço do produto deve ser maior que zero.',
      );
    }

    await this.validateCategoriesExist(product.categoryIds);

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

    await this.prisma.$transaction(async (transaction) => {
      await transaction.product.delete({ where: { id } });

      await transaction.outboxEvent.create({
        data: {
          aggregateId: id,
          eventType: PRODUCT_DELETED_EVENT,
          payload: { productId: id },
        },
      });
    });

    this.logger.info({ productId: id }, 'Produto deletado com sucesso.');
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

  private async validateCategoriesExist(categoryIds?: string[]) {
    if (!categoryIds?.length) {
      return;
    }

    await Promise.all(
      categoryIds.map((categoryId) =>
        this.categoriesService.getById(categoryId),
      ),
    );
  }
}
