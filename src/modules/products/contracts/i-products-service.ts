import { CreateProductDto } from '../dtos/input/create-product-dto';
import { UpdateProductDto } from '../dtos/input/update-product-dto';
import { ProductsLisResponseDto } from '../dtos/output/product-list-response-dto';
import { ProductResponseDto } from '../dtos/output/product-response-dto';

export interface IProductsService {
  getAll(): Promise<ProductsLisResponseDto>;
  getById(id: string): Promise<ProductResponseDto>;
  create(product: CreateProductDto): Promise<ProductResponseDto>;
  update(id: string, product: UpdateProductDto): Promise<ProductResponseDto>;
  addCategoriesToProduct(
    id: string,
    categoriesId: string[],
  ): Promise<ProductResponseDto>;
  removeCategoriesFromProduct(
    id: string,
    categoriesId: string[],
  ): Promise<ProductResponseDto>;
  delete(id: string): Promise<void>;
}
