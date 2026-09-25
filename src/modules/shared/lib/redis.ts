import Redis from 'ioredis'

const DEFAULT_REDIS_URL = 'redis://localhost:6379'

export function redisUrl(): string {
  return process.env.REDIS_URL ?? DEFAULT_REDIS_URL
}

export function createRedis(): Redis {
  return new Redis(redisUrl())
}