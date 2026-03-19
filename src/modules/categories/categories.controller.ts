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
import { ICategoriesService } from './contracts/i-categories-service';
import { Ok } from 'src/common/utils/response-util';
import { UpdateCategoryDto } from './dtos/input/update-category-dto';
import { CreateCategoryDto } from './dtos/input/create-category-dto';

@Controller('categories')
export class CategoriesController {
  constructor(
    @Inject('ICategoriesService')
    private readonly categoryService: ICategoriesService,
  ) {}

  @HttpCode(200)
  @Get()
  async getAll() {
    const response = await this.categoryService.getAll();

    const message =
      response.categories.length <= 0
        ? 'Nenhuma categoria encontrada.'
        : 'Categorias encontrados com sucesso.';

    return Ok(message, response);
  }

  @HttpCode(200)
  @Get(':id')
  async getById(@Param('id') id: string) {
    const response = await this.categoryService.getById(id);

    return Ok('Categoria encontrada com sucesso.', response);
  }

  @HttpCode(200)
  @Get(':id/products')
  async getProductsByCategory(@Param('id') id: string) {
    const response = await this.categoryService.getProductsByCategory(id);

    return Ok('Produtos com essa categoria encontrato com sucesso.', response);
  }

  @HttpCode(201)
  @Post()
  async create(@Body() createCategoryDto: CreateCategoryDto) {
    const response = await this.categoryService.create(createCategoryDto);

    return Ok('Categoria criada com sucesso.', response);
  }

  @HttpCode(200)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    const response = await this.categoryService.update(id, updateCategoryDto);

    return Ok('Categoria atualizada com sucesso.', response);
  }

  @HttpCode(204)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    await this.categoryService.delete(id);

    return Ok('Categoria removida com sucesso.');
  }
}
