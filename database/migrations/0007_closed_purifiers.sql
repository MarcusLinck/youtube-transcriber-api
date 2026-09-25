ALTER TABLE "users" ALTER COLUMN "active" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "confirmation_token" text;