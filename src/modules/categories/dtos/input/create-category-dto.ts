import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Calçados',
    description: 'Nome da categoria',
  })
  @IsString({ message: 'O campo [name] precisa ser uma string.' })
  @IsNotEmpty({ message: 'O campo [name] não pode estar vazio.' })
  name: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indica se a categoria está ativa',
  })
  @IsOptional()
  @IsBoolean({ message: 'O campo [isActive] precisa ser um booleano.' })
  isActive?: boolean;
}
