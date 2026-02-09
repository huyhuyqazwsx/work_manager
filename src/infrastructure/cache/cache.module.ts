import { Global, Module } from '@nestjs/common';
import { RedisCacheRepository } from './redis/redis-cache.repository';

@Global()
@Module({
  providers: [
    {
      provide: 'ICacheRepository',
      useClass: RedisCacheRepository,
    },
  ],
  exports: ['ICacheRepository'],
})
export class CacheModule {}
