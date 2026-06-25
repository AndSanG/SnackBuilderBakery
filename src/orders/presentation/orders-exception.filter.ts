import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import {
  EmptyOrderError,
  OrderNotFoundError,
  UnknownMenuItemError,
} from '../application/order-errors';

type OrderError = EmptyOrderError | UnknownMenuItemError | OrderNotFoundError;

// Maps the order domain errors to HTTP statuses at the boundary, so the use
// cases stay framework-free. Not-found is 404; bad order requests are 400.
@Catch(EmptyOrderError, UnknownMenuItemError, OrderNotFoundError)
export class OrdersExceptionFilter implements ExceptionFilter {
  catch(error: OrderError, host: ArgumentsHost): void {
    const status = error instanceof OrderNotFoundError ? 404 : 400;
    const response = host.switchToHttp().getResponse();
    response.status(status).json({ statusCode: status, message: error.message });
  }
}
