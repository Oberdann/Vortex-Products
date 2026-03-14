import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class UpdateCategoryDto {
  @ApiPropertyOptional({
    example: 'Calçados',
    description: 'Nome da categoria',
  })
  @IsOptional()
  @IsString({ message: 'O campo [name] precisa ser uma string.' })
  name?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Indica se a categoria está ativa',
  })
  @IsOptional()
  @IsBoolean({ message: 'O campo [isActive] precisa ser um booleano.' })
  isActive?: boolean;
}
