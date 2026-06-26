import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { collectDefaultMetrics } from 'prom-client';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap(): Promise<void> {
  collectDefaultMetrics();
  const app = configureApp(
    await NestFactory.create(AppModule, { bufferLogs: true }),
  );
  app.useLogger(app.get(Logger));
  app.enableCors(); // ponytail: lets the static endpoint tester (public/tester.html) call the API
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

void bootstrap();
