CREATE TABLE "videos" (
	"id" text PRIMARY KEY NOT NULL,
	"content" text NOT NULL,
	"youtube_url" text NOT NULL,
	"youtube_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
