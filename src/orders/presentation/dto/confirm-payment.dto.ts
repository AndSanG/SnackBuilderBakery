import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { PaymentMethod } from '../../domain/payment';

export class ConfirmPaymentDto {
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  // Cash: the amount handed over. Card: the token. The processor enforces that
  // the field matching the method is present and valid.
  @IsOptional()
  @IsInt()
  @Min(0)
  amountTendered?: number;

  @IsOptional()
  @IsString()
  cardToken?: string;
}
