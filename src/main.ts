import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'reflect-metadata';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { HttpExceptionFilter } from '@helper/filters';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  let app: NestExpressApplication;

  if (isProduction) {
    app = await NestFactory.create<NestExpressApplication>(AppModule);
  } else {
    const httpsOptions = {
      key: fs.readFileSync('./secrets/key.pem'),
      cert: fs.readFileSync('./secrets/cert.pem'),
    };

    app = await NestFactory.create<NestExpressApplication>(AppModule, {
      httpsOptions,
    });
  }

  app.setGlobalPrefix('v1');
  app.use(cookieParser());

  app.useStaticAssets(path.join(process.cwd(), 'uploads'), {
    prefix: '/uploads',
  });

  app.enableCors({
    origin: isProduction
      ? 'https://work-manager-fe.vercel.app'
      : 'https://localhost:5173',
    credentials: true,
  });

  app.useGlobalFilters(new HttpExceptionFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Work Manager API')
    .setDescription('API documentation for Work Manager')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        in: 'header',
      },
      'access-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3000;

  await app.listen(port, '0.0.0.0');

  const protocol = isProduction ? 'https' : 'https';

  console.log(`App running on ${protocol}://localhost:${port}`);
  console.log(`Swagger: ${protocol}://localhost:${port}/api`);
}

void bootstrap();
