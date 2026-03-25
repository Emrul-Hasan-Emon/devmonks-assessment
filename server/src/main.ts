import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

import { ConfigService } from '@nestjs/config';
import * as morgan from 'morgan';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(morgan('tiny'));

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
    }),
  );

  // Increase request size limit
  app.use(bodyParser.json({ limit: '100mb' })); // Adjust the limit as per your needs
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true })); // Adjust the limit as per your needs

  app.use(cookieParser());
  app.use(compression());
  app.enableCors();
  app.enableVersioning({
    type: VersioningType.URI,
  });
  await app.listen(app.get(ConfigService).get('PORT'));
}
bootstrap();
