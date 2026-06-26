import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from '../../domain/menu-item';

export class CreateMenuItemDto {
  @ApiProperty({ example: 'Chocolate Chip' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: Category, example: Category.Cookie })
  @IsEnum(Category)
  category!: Category;

  @ApiProperty({ description: 'Price in integer cents', example: 250 })
  @IsInt()
  @Min(1)
  price!: number;
}
