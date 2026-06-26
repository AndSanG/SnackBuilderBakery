import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Category } from '../../domain/menu-item';

export class UpdateMenuItemDto {
  @ApiPropertyOptional({ example: 'Double Chocolate Chip' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @ApiPropertyOptional({ enum: Category, example: Category.Cookie })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiPropertyOptional({ description: 'Price in integer cents', example: 300 })
  @IsOptional()
  @IsInt()
  @Min(1)
  price?: number;
}
