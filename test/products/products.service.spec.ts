import { Test, TestingModule } from '@nestjs/testing';
import { ICategoriesService } from 'src/modules/categories/contracts/i-categories-service';
import { ProductsService } from 'src/modules/products/products.service';

import { ProductNotFoundException } from 'src/modules/products/exceptions/product-not-found-exception';
import { ProductNameAlreadyExistsException } from 'src/modules/products/exceptions/product-name-already-exists-exception';
import { InvalidProductPriceException } from 'src/modules/products/exceptions/invalid-product-price-exception';
import { InvalidProductStockException } from 'src/modules/products/exceptions/invalid-product-stock-exception';

import { ProductMapper } from 'src/modules/products/mapper/products.mapper';
import { CreateProductDto } from 'src/modules/products/dtos/input/create-product-dto';
import { UpdateProductDto } from 'src/modules/products/dtos/input/update-product-dto';
import { PrismaService } from 'src/database/prisma.service';

jest.mock('src/modules/products/mapper/products.mapper');

type MockPrisma = {
  product: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: MockPrisma;
  let categoriesService: jest.Mocked<ICategoriesService>;

  const mockProduct = {
    id: '1',
    name: 'Product 1',
    description: 'desc',
    price: 100,
    stock: 10,
    isActive: true,
    categories: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const prismaMock: MockPrisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const categoriesServiceMock: jest.Mocked<ICategoriesService> = {
      getAll: jest.fn(),
      getById: jest.fn(),
      getProductsByCategory: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: 'ICategoriesService', useValue: categoriesServiceMock },
      ],
    }).compile();

    service = module.get(ProductsService);
    prisma = module.get(PrismaService);
    categoriesService = module.get('ICategoriesService');

    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all products', async () => {
      prisma.product.findMany.mockResolvedValue([mockProduct]);

      (ProductMapper.toListResponseDto as jest.Mock).mockReturnValue({
        products: [mockProduct],
      });

      const result = await service.getAll();

      expect(prisma.product.findMany).toHaveBeenCalled();
      expect(ProductMapper.toListResponseDto).toHaveBeenCalledWith([
        mockProduct,
      ]);
      expect(result).toEqual({ products: [mockProduct] });
    });
  });

  describe('getById', () => {
    it('should return product by id', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      (ProductMapper.toResponseDto as jest.Mock).mockReturnValue(mockProduct);

      const result = await service.getById('1');

      expect(result).toEqual(mockProduct);
    });

    it('should throw if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.getById('1')).rejects.toThrow(
        ProductNotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create product', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(mockProduct);

      (ProductMapper.toPrismaCreate as jest.Mock).mockReturnValue({});
      (ProductMapper.toResponseDto as jest.Mock).mockReturnValue(mockProduct);

      const dto: CreateProductDto = {
        name: 'Product 1',
        description: 'desc',
        price: 100,
        stock: 10,
        isActive: true,
      };

      const result = await service.create(dto);

      expect(prisma.product.create).toHaveBeenCalled();
      expect(result).toEqual(mockProduct);
    });

    it('should throw if product name already exists', async () => {
      prisma.product.findFirst.mockResolvedValue(mockProduct);

      await expect(
        service.create({
          name: 'Product 1',
          price: 10,
          stock: 1,
        } as CreateProductDto),
      ).rejects.toThrow(ProductNameAlreadyExistsException);
    });

    it('should throw if price is negative', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Product 1',
          price: -1,
          stock: 1,
        } as CreateProductDto),
      ).rejects.toThrow(InvalidProductPriceException);
    });

    it('should throw if stock is negative', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.create({
          name: 'Product 1',
          price: 10,
          stock: -1,
        } as CreateProductDto),
      ).rejects.toThrow(InvalidProductStockException);
    });
  });

  describe('update', () => {
    it('should update product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.update.mockResolvedValue(mockProduct);

      (ProductMapper.toPrismaUpdate as jest.Mock).mockReturnValue({});
      (ProductMapper.toResponseDto as jest.Mock).mockReturnValue(mockProduct);

      const dto: UpdateProductDto = { name: 'Updated' };

      const result = await service.update('1', dto);

      expect(result).toEqual(mockProduct);
    });

    it('should throw if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.update('1', {})).rejects.toThrow(
        ProductNotFoundException,
      );
    });

    it('should throw if name already exists', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.findFirst.mockResolvedValue(mockProduct);

      await expect(service.update('1', { name: 'Duplicate' })).rejects.toThrow(
        ProductNameAlreadyExistsException,
      );
    });

    it('should throw if price is negative', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.update('1', { price: -1 })).rejects.toThrow(
        InvalidProductPriceException,
      );
    });

    it('should throw if stock is negative', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);

      await expect(service.update('1', { stock: -1 })).rejects.toThrow(
        InvalidProductStockException,
      );
    });
  });

  describe('addCategoriesToProduct', () => {
    it('should add categories to product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue(mockProduct);

      const mockCategory = {
        id: 'cat1',
        name: 'Category 1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      categoriesService.getById.mockResolvedValue(mockCategory);

      (ProductMapper.toResponseDto as jest.Mock).mockReturnValue(mockProduct);

      const result = await service.addCategoriesToProduct('1', ['cat1']);

      expect(categoriesService.getById).toHaveBeenCalledWith('cat1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          categories: {
            connect: [{ id: 'cat1' }],
          },
        },
        include: { categories: true },
      });

      expect(result).toEqual(mockProduct);
    });
  });

  describe('removeCategoriesFromProduct', () => {
    it('should remove categories from product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.update.mockResolvedValue(mockProduct);

      const mockCategory = {
        id: 'cat1',
        name: 'Category 1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      categoriesService.getById.mockResolvedValue(mockCategory);

      (ProductMapper.toResponseDto as jest.Mock).mockReturnValue(mockProduct);

      const result = await service.removeCategoriesFromProduct('1', ['cat1']);

      expect(categoriesService.getById).toHaveBeenCalledWith('cat1');

      expect(prisma.product.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {
          categories: {
            disconnect: [{ id: 'cat1' }],
          },
        },
        include: { categories: true },
      });

      expect(result).toEqual(mockProduct);
    });
  });

  describe('delete', () => {
    it('should delete product', async () => {
      prisma.product.findUnique.mockResolvedValue(mockProduct);
      prisma.product.delete.mockResolvedValue(mockProduct);

      await service.delete('1');

      expect(prisma.product.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw if product not found', async () => {
      prisma.product.findUnique.mockResolvedValue(null);

      await expect(service.delete('1')).rejects.toThrow(
        ProductNotFoundException,
      );
    });
  });
});
