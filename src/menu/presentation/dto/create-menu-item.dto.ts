import { IsEnum, IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { Category } from '../../domain/menu-item';

export class CreateMenuItemDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(Category)
  category!: Category;

  @IsInt()
  @Min(1)
  price!: number; // integer cents
}
