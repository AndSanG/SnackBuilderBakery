import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configureApp } from './configure-app';

async function bootstrap(): Promise<void> {
  const app = configureApp(await NestFactory.create(AppModule));
  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

void bootstrap();
