import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesController } from 'src/modules/categories/categories.controller';
import { ICategoriesService } from 'src/modules/categories/contracts/i-categories-service';
import { CreateCategoryDto } from 'src/modules/categories/dtos/input/create-category-dto';
import { UpdateCategoryDto } from 'src/modules/categories/dtos/input/update-category-dto';

describe('CategoriesController', () => {
  let controller: CategoriesController;
  let service: jest.Mocked<ICategoriesService>;

  const mockCategory = {
    id: '1',
    name: 'Category 1',
    isActive: true,
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const serviceMock: jest.Mocked<ICategoriesService> = {
      getAll: jest.fn(),
      getById: jest.fn(),
      getProductsByCategory: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],
      providers: [{ provide: 'ICategoriesService', useValue: serviceMock }],
    }).compile();

    controller = module.get(CategoriesController);
    service = module.get('ICategoriesService');

    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return categories with success message', async () => {
      service.getAll.mockResolvedValue({
        categories: [mockCategory],
      });

      const result = await controller.getAll();

      expect(service.getAll).toHaveBeenCalled();

      expect(result).toEqual({
        message: 'Categorias encontrados com sucesso.',
        data: { categories: [mockCategory] },
        success: true,
      });
    });

    it('should return empty message when no categories', async () => {
      service.getAll.mockResolvedValue({
        categories: [],
      });

      const result = await controller.getAll();

      expect(result).toEqual({
        message: 'Nenhuma categoria encontrada.',
        data: { categories: [] },
        success: true,
      });
    });
  });

  describe('getById', () => {
    it('should return category by id', async () => {
      service.getById.mockResolvedValue(mockCategory);

      const result = await controller.getById('1');

      expect(service.getById).toHaveBeenCalledWith('1');

      expect(result).toEqual({
        message: 'Categoria encontrada com sucesso.',
        data: mockCategory,
        success: true,
      });
    });
  });

  describe('getProductsByCategory', () => {
    it('should return products by category', async () => {
      service.getProductsByCategory.mockResolvedValue(mockCategory);

      const result = await controller.getProductsByCategory('1');

      expect(service.getProductsByCategory).toHaveBeenCalledWith('1');

      expect(result).toEqual({
        message: 'Produtos com essa categoria encontrato com sucesso.',
        data: mockCategory,
        success: true,
      });
    });
  });

  describe('create', () => {
    it('should create a category', async () => {
      const dto: CreateCategoryDto = {
        name: 'Category 1',
        isActive: true,
      };

      service.create.mockResolvedValue(mockCategory);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);

      expect(result).toEqual({
        message: 'Categoria criada com sucesso.',
        data: mockCategory,
        success: true,
      });
    });
  });

  describe('update', () => {
    it('should update a category', async () => {
      const dto: UpdateCategoryDto = {
        name: 'Updated',
      };

      service.update.mockResolvedValue(mockCategory);

      const result = await controller.update('1', dto);

      expect(service.update).toHaveBeenCalledWith('1', dto);

      expect(result).toEqual({
        message: 'Categoria atualizada com sucesso.',
        data: mockCategory,
        success: true,
      });
    });
  });

  describe('delete', () => {
    it('should delete a category', async () => {
      service.delete.mockResolvedValue(undefined);

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');

      expect(result).toEqual({
        message: 'Categoria removida com sucesso.',
        data: [],
        success: true,
      });
    });
  });
});
