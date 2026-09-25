import { Pool } from 'pg'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'

const ADMIN_DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/postgres'

const MIGRATIONS_FOLDER = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  '..',
  'database',
  'migrations',
)

export function databaseUrl(dbName: string): string {
  return `postgresql://postgres:postgres@localhost:5432/${dbName}`
}

export async function createDatabaseIfNotExists(dbName: string): Promise<void> {
  const admin = new Pool({ connectionString: ADMIN_DATABASE_URL })

  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [dbName])

    if (rowCount === 0) {
      try {
        await admin.query(`CREATE DATABASE "${dbName}"`)
      } catch (error) {
        const code = (error as { code?: string })?.code
        if (code !== '42P04') throw error
      }
    }
  } finally {
    await admin.end()
  }
}

export async function runMigrations(dbName: string): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl(dbName) })

  try {
    const db = drizzle({ client: pool })
    await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER })
  } finally {
    await pool.end()
  }
}

export async function truncateTables(dbName: string): Promise<void> {
  const pool = new Pool({ connectionString: databaseUrl(dbName) })

  try {
    await pool.query('TRUNCATE TABLE video_chapters, video_transcriptions, videos RESTART IDENTITY CASCADE')
  } finally {
    await pool.end()
  }
}