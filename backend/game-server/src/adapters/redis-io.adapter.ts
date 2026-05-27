import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import Redis from 'ioredis';

export class RedisIoAdapter extends IoAdapter {
  private adapterConstructor!: ReturnType<typeof createAdapter>;

  async connectToRedis(url: string): Promise<void> {
    const pub = new Redis(url);
    const sub = pub.duplicate();
    this.adapterConstructor = createAdapter(pub, sub);
  }

  override createIOServer(port: number, options?: ServerOptions) {
    const rawOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:4200';
    const origins = rawOrigin.split(',').map((o) => o.trim());

    const server = super.createIOServer(port, {
      ...options,
      cors: { origin: origins, credentials: true },
    });
    server.adapter(this.adapterConstructor);
    return server;
  }
}
