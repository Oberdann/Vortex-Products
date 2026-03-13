export class ProductResponseDto {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  isActive: boolean;
  categories: {
    name: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}
