import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody needed for Stripe webhook signature verification
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.use(helmet());

  const allowedOrigins = new Set([
    process.env.FRONTEND_URL,
    'https://bunkertank.io',
    'https://www.bunkertank.io',
    ...(process.env.NODE_ENV !== 'production'
      ? ['http://localhost:4200', 'http://localhost:4201']
      : []),
  ].filter(Boolean) as string[]);
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) callback(null, true);
      else callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}`);
}

bootstrap();
