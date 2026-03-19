import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { IProductsService } from './contracts/i-products-service';
import { Ok } from 'src/common/utils/response-util';
import { CreateProductDto } from './dtos/input/create-product-dto';
import { UpdateProductDto } from './dtos/input/update-product-dto';
import { AddCategoriesToProductDto } from './dtos/input/add-categories-to-product';
import { RemoveCategoriesFromProductDto } from './dtos/input/remove-categories-from-product';

@Controller('products')
export class ProductsController {
  constructor(
    @Inject('IProductsService')
    private readonly productService: IProductsService,
  ) {}

  @HttpCode(200)
  @Get()
  async getAll() {
    const response = await this.productService.getAll();

    const message =
      response.products.length <= 0
        ? 'Nenhum produto encontrado.'
        : 'Produtos encontrados com sucesso.';

    return Ok(message, response);
  }

  @HttpCode(200)
  @Get(':id')
  async getById(@Param('id') id: string) {
    const response = await this.productService.getById(id);

    return Ok('Produto encontrado com sucesso.', response);
  }

  @HttpCode(201)
  @Post()
  async create(@Body() product: CreateProductDto) {
    const response = await this.productService.create(product);

    return Ok('Produto criado com sucesso.', response);
  }

  @HttpCode(200)
  @Put(':id')
  async update(@Param('id') id: string, @Body() product: UpdateProductDto) {
    const response = await this.productService.update(id, product);

    return Ok('Produto atualizado com sucesso.', response);
  }

  @HttpCode(200)
  @Put(':id/categories/add')
  async addCategoriesToProduct(
    @Param('id') id: string,
    @Body() categoriesId: AddCategoriesToProductDto,
  ) {
    const response = await this.productService.addCategoriesToProduct(
      id,
      categoriesId.categoryIds,
    );

    return Ok('Categorias adicionadas com sucesso.', response);
  }

  @HttpCode(200)
  @Put(':id/categories/remove')
  async removeCategoriesFromProduct(
    @Param('id') id: string,
    @Body() categoriesId: RemoveCategoriesFromProductDto,
  ) {
    const response = await this.productService.removeCategoriesFromProduct(
      id,
      categoriesId.categoryIds,
    );

    return Ok('Categorias removiadas com sucesso.', response);
  }

  @HttpCode(204)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.productService.delete(id);

    return Ok('Produto deletado com sucesso.');
  }
}
