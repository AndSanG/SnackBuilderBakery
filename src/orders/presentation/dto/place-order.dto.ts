import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderSource } from '../../domain/order-source';

class OrderLineDto {
  @IsString()
  @IsNotEmpty()
  menuItemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class PlaceOrderDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];

  @IsEnum(OrderSource)
  source!: OrderSource;
}
