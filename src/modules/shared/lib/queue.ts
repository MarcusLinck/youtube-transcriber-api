import { Queue, Worker, type Processor } from 'bullmq'
import { redisUrl } from './redis.ts'

const connection = { url: redisUrl() }

export function createQueue<T = unknown>(name: string): Queue<T> {
  return new Queue<T>(name, { connection })
}

export function createWorker<T = unknown>(name: string, processor: Processor<T>): Worker<T> {
  return new Worker<T>(name, processor, { connection })
}