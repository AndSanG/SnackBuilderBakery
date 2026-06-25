import { INestApplication, ValidationPipe } from '@nestjs/common';
import { MenuItemNotFoundFilter } from './menu/presentation/menu-item-not-found.filter';
import { OrdersExceptionFilter } from './orders/presentation/orders-exception.filter';

// Global pipe and filter setup shared by the real bootstrap and the e2e tests,
// so both exercise the same app: DTO validation in, domain errors mapped out.
export function configureApp(app: INestApplication): INestApplication {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new MenuItemNotFoundFilter(), new OrdersExceptionFilter());
  return app;
}
