import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const webOrigin = config.get<string>('WEB_ORIGIN', 'http://localhost:3000');

  app.enableCors({
    origin: webOrigin,
    methods: ['GET', 'POST'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const port = config.get<number>('PORT', 4000);
  await app.listen(port);
}

bootstrap();
