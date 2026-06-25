import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import {
  EmptyOrderError,
  OrderAlreadyConfirmedError,
  OrderNotFoundError,
  UnknownMenuItemError,
} from '../application/order-errors';

type OrderError =
  | EmptyOrderError
  | UnknownMenuItemError
  | OrderNotFoundError
  | OrderAlreadyConfirmedError;

// Maps the order domain errors to HTTP statuses at the boundary, so the use
// cases stay framework-free. Not-found is 404, a wrong-state confirm is 409,
// and bad order requests are 400.
@Catch(
  EmptyOrderError,
  UnknownMenuItemError,
  OrderNotFoundError,
  OrderAlreadyConfirmedError,
)
export class OrdersExceptionFilter implements ExceptionFilter {
  catch(error: OrderError, host: ArgumentsHost): void {
    const status = this.statusFor(error);
    const response = host.switchToHttp().getResponse();
    response.status(status).json({ statusCode: status, message: error.message });
  }

  private statusFor(error: OrderError): number {
    if (error instanceof OrderNotFoundError) {
      return 404;
    }
    if (error instanceof OrderAlreadyConfirmedError) {
      return 409;
    }
    return 400;
  }
}
