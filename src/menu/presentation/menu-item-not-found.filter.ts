import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { MenuItemNotFoundError } from '../application/menu-errors';

interface HttpResponse {
  status(code: number): HttpResponse;
  json(body: unknown): HttpResponse;
}

// Maps the domain not-found error to a 404 at the HTTP boundary, so the use
// cases stay framework-free and never know about HTTP status codes.
@Catch(MenuItemNotFoundError)
export class MenuItemNotFoundFilter implements ExceptionFilter {
  catch(error: MenuItemNotFoundError, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<HttpResponse>();
    response.status(404).json({ statusCode: 404, message: error.message });
  }
}
