import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { collectDefaultMetrics } from 'prom-client';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap(): Promise<void> {
  collectDefaultMetrics();
  const app = configureApp(
    await NestFactory.create(AppModule, { bufferLogs: true }),
  );
  app.useLogger(app.get(Logger));
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Snack Builder Bakery')
    .setDescription('Order management, storefront, and kitchen scheduling API')
    .setVersion(process.env.APP_VERSION ?? 'dev')
    .build();
  SwaggerModule.setup('api', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

void bootstrap();
