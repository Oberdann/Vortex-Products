import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from 'src/modules/categories/categories.service';
import { PrismaService } from 'src/database/prisma.service';
import { CategoryMapper } from 'src/modules/categories/mapper/categories.mapper';

import { CategoryNotFoundException } from 'src/modules/categories/exceptions/category-not-found-exception';
import { CategoryNameAlreadyExistsException } from 'src/modules/categories/exceptions/category-name-already-exists-exception';

import { CreateCategoryDto } from 'src/modules/categories/dtos/input/create-category-dto';
import { UpdateCategoryDto } from 'src/modules/categories/dtos/input/update-category-dto';

jest.mock('src/modules/categories/mapper/categories.mapper');

type MockPrisma = {
  category: {
    findMany: jest.Mock;
    findUnique: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: MockPrisma;

  const mockCategory = {
    id: '1',
    name: 'Category 1',
    isActive: true,
    products: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const prismaMock: MockPrisma = {
      category: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get(CategoriesService);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should return all categories', async () => {
      prisma.category.findMany.mockResolvedValue([mockCategory]);

      (CategoryMapper.toListResponseDto as jest.Mock).mockReturnValue({
        categories: [mockCategory],
      });

      const result = await service.getAll();

      expect(prisma.category.findMany).toHaveBeenCalled();
      expect(CategoryMapper.toListResponseDto).toHaveBeenCalledWith([
        mockCategory,
      ]);
      expect(result).toEqual({ categories: [mockCategory] });
    });

    it('should return empty list', async () => {
      prisma.category.findMany.mockResolvedValue([]);

      (CategoryMapper.toListResponseDto as jest.Mock).mockReturnValue({
        categories: [],
      });

      const result = await service.getAll();

      expect(result).toEqual({ categories: [] });
    });
  });

  describe('getById', () => {
    it('should return category', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);

      (CategoryMapper.toResponseDto as jest.Mock).mockReturnValue(mockCategory);

      const result = await service.getById('1');

      expect(result).toEqual(mockCategory);
    });

    it('should throw if not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.getById('1')).rejects.toThrow(
        CategoryNotFoundException,
      );
    });
  });

  describe('getProductsByCategory', () => {
    it('should return category with products', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);

      (CategoryMapper.toResponseDto as jest.Mock).mockReturnValue(mockCategory);

      const result = await service.getProductsByCategory('1');

      expect(prisma.category.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: {
          products: {
            where: { isActive: true },
          },
        },
      });

      expect(result).toEqual(mockCategory);
    });

    it('should throw if not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.getProductsByCategory('1')).rejects.toThrow(
        CategoryNotFoundException,
      );
    });
  });

  describe('create', () => {
    it('should create category', async () => {
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue(mockCategory);

      (CategoryMapper.toResponseDto as jest.Mock).mockReturnValue(mockCategory);

      const dto: CreateCategoryDto = {
        name: 'Category 1',
        isActive: true,
      };

      const result = await service.create(dto);

      expect(prisma.category.create).toHaveBeenCalledWith({
        data: dto,
      });

      expect(result).toEqual(mockCategory);
    });

    it('should throw if name already exists', async () => {
      prisma.category.findFirst.mockResolvedValue(mockCategory);

      await expect(
        service.create({
          name: 'Category 1',
        } as CreateCategoryDto),
      ).rejects.toThrow(CategoryNameAlreadyExistsException);
    });
  });

  describe('update', () => {
    it('should update category', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.update.mockResolvedValue(mockCategory);

      (CategoryMapper.toPrismaUpdate as jest.Mock).mockReturnValue({});
      (CategoryMapper.toResponseDto as jest.Mock).mockReturnValue(mockCategory);

      const dto: UpdateCategoryDto = { name: 'Updated' };

      const result = await service.update('1', dto);

      expect(prisma.category.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: {},
      });

      expect(result).toEqual(mockCategory);
    });

    it('should throw if not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.update('1', {})).rejects.toThrow(
        CategoryNotFoundException,
      );
    });

    it('should throw if name already exists', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.category.findFirst.mockResolvedValue(mockCategory);

      await expect(service.update('1', { name: 'Duplicate' })).rejects.toThrow(
        CategoryNameAlreadyExistsException,
      );
    });
  });

  describe('delete', () => {
    it('should delete category', async () => {
      prisma.category.findUnique.mockResolvedValue(mockCategory);
      prisma.category.delete.mockResolvedValue(mockCategory);

      await service.delete('1');

      expect(prisma.category.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw if not found', async () => {
      prisma.category.findUnique.mockResolvedValue(null);

      await expect(service.delete('1')).rejects.toThrow(
        CategoryNotFoundException,
      );
    });
  });
});
