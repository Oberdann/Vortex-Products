import { Test, TestingModule } from '@nestjs/testing';
import { IProductsService } from 'src/modules/products/contracts/i-products-service';
import { CreateProductDto } from 'src/modules/products/dtos/input/create-product-dto';
import { UpdateProductDto } from 'src/modules/products/dtos/input/update-product-dto';
import { ProductsController } from 'src/modules/products/products.controller';

describe('ProductsController', () => {
  let controller: ProductsController;
  let service: jest.Mocked<IProductsService>;

  const mockProduct = {
    id: '1',
    name: 'Product 1',
    description: 'desc',
    price: 100,
    stock: 10,
    isActive: true,
    categories: [{ name: 'Cat 1' }],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockService: jest.Mocked<IProductsService> = {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      addCategoriesToProduct: jest.fn(),
      removeCategoriesFromProduct: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        {
          provide: 'IProductsService',
          useValue: mockService,
        },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
    service = module.get('IProductsService');
  });

  describe('getAll', () => {
    it('should return products with success message', async () => {
      service.getAll.mockResolvedValue({
        products: [mockProduct],
      });

      const result = await controller.getAll();

      expect(service.getAll).toHaveBeenCalled();

      expect(result).toEqual({
        message: 'Produtos encontrados com sucesso.',
        data: { products: [mockProduct] },
        success: true,
      });
    });

    it('should return empty message when no products', async () => {
      service.getAll.mockResolvedValue({
        products: [],
      });

      const result = await controller.getAll();

      expect(result).toEqual({
        message: 'Nenhum produto encontrado.',
        data: { products: [] },
        success: true,
      });
    });
  });

  describe('getById', () => {
    it('should return a product', async () => {
      service.getById.mockResolvedValue(mockProduct);

      const result = await controller.getById('1');

      expect(service.getById).toHaveBeenCalledWith('1');

      expect(result).toEqual({
        message: 'Produto encontrado com sucesso.',
        data: mockProduct,
        success: true,
      });
    });
  });

  describe('create', () => {
    it('should create a product', async () => {
      const dto: CreateProductDto = {
        name: 'Product 1',
        description: 'desc',
        price: 100,
        stock: 10,
        isActive: true,
      };

      service.create.mockResolvedValue(mockProduct);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);

      expect(result).toEqual({
        message: 'Produto criado com sucesso.',
        data: mockProduct,
        success: true,
      });
    });
  });

  describe('update', () => {
    it('should update a product', async () => {
      const dto: UpdateProductDto = {
        name: 'Updated',
      };

      service.update.mockResolvedValue(mockProduct);

      const result = await controller.update('1', dto);

      expect(service.update).toHaveBeenCalledWith('1', dto);

      expect(result).toEqual({
        message: 'Produto atualizado com sucesso.',
        data: mockProduct,
        success: true,
      });
    });
  });

  describe('addCategoriesToProduct', () => {
    it('should add categories', async () => {
      const dto = { categoryIds: ['cat1', 'cat2'] };

      service.addCategoriesToProduct.mockResolvedValue(mockProduct);

      const result = await controller.addCategoriesToProduct('1', dto);

      expect(service.addCategoriesToProduct).toHaveBeenCalledWith(
        '1',
        dto.categoryIds,
      );

      expect(result).toEqual({
        message: 'Categorias adicionadas com sucesso.',
        data: mockProduct,
        success: true,
      });
    });
  });

  describe('removeCategoriesFromProduct', () => {
    it('should remove categories', async () => {
      const dto = { categoryIds: ['cat1'] };

      service.removeCategoriesFromProduct.mockResolvedValue(mockProduct);

      const result = await controller.removeCategoriesFromProduct('1', dto);

      expect(service.removeCategoriesFromProduct).toHaveBeenCalledWith(
        '1',
        dto.categoryIds,
      );

      expect(result).toEqual({
        message: 'Categorias removiadas com sucesso.',
        data: mockProduct,
        success: true,
      });
    });
  });

  describe('delete', () => {
    it('should delete a product', async () => {
      service.delete.mockResolvedValue(undefined);

      const result = await controller.delete('1');

      expect(service.delete).toHaveBeenCalledWith('1');

      expect(result).toEqual({
        message: 'Produto deletado com sucesso.',
        data: [],
        success: true,
      });
    });
  });
});
