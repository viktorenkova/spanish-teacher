CREATE TYPE "public"."a1_band" AS ENUM('early', 'mid', 'strong');--> statement-breakpoint
CREATE TYPE "public"."assessment_status" AS ENUM('assessed', 'unassessed');--> statement-breakpoint
CREATE TYPE "public"."learner_skill" AS ENUM('vocabulary', 'grammar', 'reading', 'listening', 'speaking');--> statement-breakpoint
CREATE TABLE "diagnostic_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"version" text NOT NULL,
	"answers" jsonb NOT NULL,
	"score" integer NOT NULL,
	"max_score" integer NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learner_skill_estimates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"skill" "learner_skill" NOT NULL,
	"cefr_level" text DEFAULT 'A1' NOT NULL,
	"a1_band" "a1_band",
	"status" "assessment_status" NOT NULL,
	"confidence" integer DEFAULT 0 NOT NULL,
	"evidence_count" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learners" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"support_language" text DEFAULT 'en' NOT NULL,
	"support_level" text DEFAULT 'B1' NOT NULL,
	"target_language" text DEFAULT 'es' NOT NULL,
	"target_variant" text DEFAULT 'es-ES' NOT NULL,
	"overall_level" text DEFAULT 'A1' NOT NULL,
	"a1_band" "a1_band" NOT NULL,
	"primary_goal" text NOT NULL,
	"prior_experience" text NOT NULL,
	"preferred_session_minutes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "diagnostic_attempts" ADD CONSTRAINT "diagnostic_attempts_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_skill_estimates" ADD CONSTRAINT "learner_skill_estimates_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "diagnostic_attempt_learner_idx" ON "diagnostic_attempts" USING btree ("learner_id");--> statement-breakpoint
CREATE UNIQUE INDEX "learner_skill_unique" ON "learner_skill_estimates" USING btree ("learner_id","skill");--> statement-breakpoint
CREATE INDEX "learner_skill_learner_idx" ON "learner_skill_estimates" USING btree ("learner_id");