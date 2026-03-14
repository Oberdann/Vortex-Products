export class CategoryResponseDto {
  id: string;
  name: string;
  isActive: boolean;
  products?: string[];
  createdAt: Date;
  updatedAt: Date;
}
