import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsArray,
  ArrayNotEmpty,
  IsBoolean,
  IsUUID,
} from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    example: 'Tênis Esportivo XYZ',
    description: 'Nome do produto',
  })
  @IsString({ message: 'O campo [name] precisa ser uma string.' })
  @IsNotEmpty({ message: 'O campo [name] não pode estar vazio.' })
  name: string;

  @ApiPropertyOptional({
    example: 'Tênis de corrida, super leve e confortável',
    description: 'Descrição detalhada do produto',
  })
  @IsOptional()
  @IsString({ message: 'O campo [description] precisa ser uma string.' })
  description?: string;

  @ApiProperty({
    example: 199.99,
    description: 'Preço do produto em reais',
  })
  @IsNumber({}, { message: 'O campo [price] precisa ser um número.' })
  @Min(0.01, { message: 'O preço deve ser de pelo menos 0,01.' })
  price: number;

  @ApiPropertyOptional({
    example: [
      'b7e2f3a1-9876-4c2d-9f0a-abcdef123456',
      'c1d2e3f4-1234-4abc-9def-987654321000',
    ],
    description: 'IDs das categorias associadas',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'O campo [categoryIds] precisa ser um array.' })
  @ArrayNotEmpty({ message: 'O campo [categoryIds] não pode estar vazio.' })
  @IsUUID('4', {
    each: true,
    message: 'Cada ID de categoria deve ser um UUID válido.',
  })
  categoryIds?: string[];

  @ApiPropertyOptional({
    example: true,
    description: 'Indica se o produto está ativo para venda',
  })
  @IsOptional()
  @IsBoolean({ message: 'O campo [isActive] precisa ser um booleano.' })
  isActive?: boolean;
}
