import {
  Redis,
} from 'ioredis';
import * as process from 'process';

// eslint-disable-next-line @typescript-eslint/no-var-requires,import/no-extraneous-dependencies
require('dotenv').config();

export class RedisConnection {
  redis: Redis;

  constructor() {
    this.init();
  }

  init() {
    const port = +(process.env.REDIS_PORT || 6379);
    const host = process.env.REDIS_HOST || 'localhost';

    this.redis = new Redis(port, host);
  }

  async get(key: string) {
    return this.redis.get(key);
  }

  async set(key: string, value: string) {
    return this.redis.set(key, value);
  }

  async delete(key: string) {
    return this.redis.del(key);
  }
}
