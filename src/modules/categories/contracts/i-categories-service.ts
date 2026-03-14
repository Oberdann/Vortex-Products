import { CreateCategoryDto } from '../dtos/input/create-category-dto';
import { UpdateCategoryDto } from '../dtos/input/update-category-dto';
import { CategoriesLisResponseDto } from '../dtos/output/category-list-response-dto';
import { CategoryResponseDto } from '../dtos/output/category-response-dto';

export interface ICategoriesService {
  getAll(): Promise<CategoriesLisResponseDto>;
  getBy(id: string): Promise<CategoryResponseDto>;
  getProductsByCategory(id: string): Promise<CategoryResponseDto>;
  create(category: CreateCategoryDto): Promise<CategoryResponseDto>;
  update(id: string, category: UpdateCategoryDto): Promise<CategoryResponseDto>;
  delete(id: string): Promise<void>;
}
