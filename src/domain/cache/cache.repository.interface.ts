export interface ICacheRepository {
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

  get<T>(key: string): Promise<T | null>;

  delete(key: string): Promise<void>;

  exists(key: string): Promise<boolean>;
}
