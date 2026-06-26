import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import {
  EmptyOrderError,
  OrderAlreadyConfirmedError,
  OrderNotFoundError,
  PaymentDeclinedError,
  UnknownMenuItemError,
} from '../application/order-errors';

type OrderError =
  | EmptyOrderError
  | UnknownMenuItemError
  | OrderNotFoundError
  | OrderAlreadyConfirmedError
  | PaymentDeclinedError;

interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: unknown): HttpResponse;
}

// Maps the order domain errors to HTTP statuses at the boundary, so the use
// cases stay framework-free. Not-found is 404, a wrong-state confirm is 409, a
// declined payment is 402, and bad order requests are 400.
@Catch(
  EmptyOrderError,
  UnknownMenuItemError,
  OrderNotFoundError,
  OrderAlreadyConfirmedError,
  PaymentDeclinedError,
)
export class OrdersExceptionFilter implements ExceptionFilter {
  catch(error: OrderError, host: ArgumentsHost): void {
    const status = this.statusFor(error);
    const response = host.switchToHttp().getResponse<HttpResponse>();
    response.status(status).json({ statusCode: status, message: error.message });
  }

  private statusFor(error: OrderError): number {
    if (error instanceof OrderNotFoundError) {
      return 404;
    }
    if (error instanceof OrderAlreadyConfirmedError) {
      return 409;
    }
    if (error instanceof PaymentDeclinedError) {
      return 402;
    }
    return 400;
  }
}
