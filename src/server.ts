import { buildApp } from './app.ts'
import { startTranscriptionWorker } from '@features/transcriptions/interfaces/workers'
import { startChapterWorker } from '@features/chapters/interfaces/workers'

const app = buildApp({ logger: true })

const workers = [startTranscriptionWorker(), startChapterWorker()]

const port = Number(process.env.PORT ?? 3333)
const host = '0.0.0.0'

app.listen({ port, host }).then(() => {
  console.log('HTTP Server Running!')
})

async function shutdown(signal: string) {
  app.log.info(`Recebido ${signal}, encerrando o servidor...`)

  await Promise.all(workers.map((worker) => worker.close()))
  await app.close()

  process.exit(0)
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))