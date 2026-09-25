import { boolean, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const userRole = pgEnum('user_role', ['user', 'admin'])

export const users = pgTable(
  'users',
  {
    id: text('id').primaryKey(),
    first_name: text('first_name').notNull(),
    last_name: text('last_name').notNull(),
    email: text('email').notNull(),
    password: text('password').notNull(),
    role: userRole('role').notNull().default('user'),
    confirmation_token: text('confirmation_token'),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    active: boolean('active').notNull().default(false),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('users_email_unique')
      .on(table.email)
      .where(sql`${table.deleted_at} is null`),
  ],
)

export const videos = pgTable('videos', {
  id: text('id').primaryKey(),
  youtube_url: text('youtube_url').notNull(),
  youtube_id: text('youtube_id').notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const videoChapters = pgTable(
  'video_chapters',
  {
    id: text('id').primaryKey(),
    video_id: text('video_id')
      .notNull()
      .references(() => videos.id),
    content: text('content').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('video_chapters_video_id_unique')
      .on(table.video_id)
      .where(sql`${table.deleted_at} is null`),
  ],
)

export const videoTranscriptions = pgTable(
  'video_transcriptions',
  {
    id: text('id').primaryKey(),
    video_id: text('video_id')
      .notNull()
      .references(() => videos.id),
    content: text('content').notNull(),
    created_at: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    deleted_at: timestamp('deleted_at', { withTimezone: true }),
    updated_at: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex('video_transcriptions_video_id_unique')
      .on(table.video_id)
      .where(sql`${table.deleted_at} is null`),
  ],
)