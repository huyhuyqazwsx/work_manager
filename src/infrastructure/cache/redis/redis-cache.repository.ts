import { Injectable, Logger } from '@nestjs/common';
import { ICacheRepository } from '../../../domain/cache/cache.repository.interface';
import { Redis } from '@upstash/redis';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisCacheRepository implements ICacheRepository {
  private readonly logger = new Logger(RedisCacheRepository.name);
  private redis: Redis;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('redis.url');
    const token = this.configService.get<string>('redis.token');

    if (!url || !token) {
      throw new Error(
        'UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be defined in environment variables',
      );
    }

    this.redis = new Redis({
      url,
      token,
    });
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (ttlSeconds) {
        await this.redis.setex(key, ttlSeconds, serialized);
      } else {
        await this.redis.set(key, serialized);
      }
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get<string>(key);

      if (!value) {
        return null;
      }

      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    } catch (error) {
      this.logger.error(`Failed to GET ${key}:`, error);
      return null;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to DEL ${key}:`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check EXISTS ${key}:`, error);
      return false;
    }
  }
}
