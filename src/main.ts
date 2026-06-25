import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { MenuItemNotFoundFilter } from './menu/presentation/menu-item-not-found.filter';
import { OrdersExceptionFilter } from './orders/presentation/orders-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new MenuItemNotFoundFilter(), new OrdersExceptionFilter());
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

void bootstrap();
