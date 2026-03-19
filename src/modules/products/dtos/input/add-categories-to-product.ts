import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddCategoriesToProductDto {
  @ApiProperty({
    description: 'Lista de IDs das categorias',
    example: [
      'b7e2f3a1-9876-4c2d-9f0a-abcdef123456',
      'c1d2e3f4-1234-4abc-9def-987654321000',
    ],
    type: [String],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', {
    each: true,
    message: 'Cada categoryId deve ser um UUID válido.',
  })
  categoryIds: string[];
}
