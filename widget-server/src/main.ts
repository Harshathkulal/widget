import 'dotenv/config';

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import compression from 'compression';

import { AppModule } from './app.module';
import { ApplicationsService } from './applications/applications.service';
import { getDevOrigins, isOriginAllowed } from './common/utils/origin';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet for security headers
  app.use(helmet());

  // Compression to reduce response sizes
  app.use(compression());

  // Set global API prefix
  app.setGlobalPrefix('api');

  // Dynamic CORS origin verification
  const applicationsService = app.get(ApplicationsService);
  app.enableCors({
    origin: async (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      try {
        const apps = await applicationsService.findAll();
        const allowedDomains = new Set<string>(
          process.env.NODE_ENV === 'production' ? [] : getDevOrigins(),
        );

        for (const application of apps) {
          if (application.status === 'ACTIVE' && application.allowedDomains) {
            for (const domain of application.allowedDomains) {
              allowedDomains.add(domain);
            }
          }
        }

        if (isOriginAllowed(origin, Array.from(allowedDomains))) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} not allowed by CORS`));
        }
      } catch (err) {
        callback(err);
      }
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT || 3000);

  console.log(
    `API running on http://localhost:${process.env.PORT || 3000}/api`,
  );
}

bootstrap();
