import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod } from '../../domain/payment';

export class ConfirmPaymentDto {
  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.Cash })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  // Cash: the amount handed over. Card: the token. The processor enforces that
  // the field matching the method is present and valid.
  @ApiPropertyOptional({ description: 'Cash only: amount tendered in cents', example: 500 })
  @IsOptional()
  @IsInt()
  @Min(0)
  amountTendered?: number;

  @ApiPropertyOptional({ description: 'Card only: payment token', example: 'tok_visa' })
  @IsOptional()
  @IsString()
  cardToken?: string;
}
