import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsArray,
  ArrayNotEmpty,
  IsBoolean,
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
  price: number;

  @ApiPropertyOptional({
    example: ['calcado', 'esporte'],
    description: 'IDs das categorias associadas',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'O campo [categoryIds] precisa ser um array.' })
  @ArrayNotEmpty({ message: 'O campo [categoryIds] não pode estar vazio.' })
  @IsString({
    each: true,
    message: 'Todos os itens de [categoryIds] devem ser strings.',
  })
  categoryIds?: string[];

  @ApiPropertyOptional({
    example: 50,
    description: 'Quantidade de itens disponíveis em estoque',
  })
  @IsOptional()
  @IsNumber({}, { message: 'O campo [stock] precisa ser um número.' })
  stock?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Indica se o produto está ativo para venda',
  })
  @IsOptional()
  @IsBoolean({ message: 'O campo [isActive] precisa ser um booleano.' })
  isActive?: boolean;
}
