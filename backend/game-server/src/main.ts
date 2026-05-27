import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './adapters/redis-io.adapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
    credentials: true,
  });

  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const redisAdapter = new RedisIoAdapter(app);
  await redisAdapter.connectToRedis(redisUrl);
  app.useWebSocketAdapter(redisAdapter);

  const port = process.env.PORT ?? 3001;
  await app.listen(port);
  console.log(`Game Server running on http://localhost:${port}`);
}

bootstrap();
