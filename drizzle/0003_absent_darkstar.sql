ALTER TABLE "exercise_attempts" ADD COLUMN "transcript" text;--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD COLUMN "evidence_provider" text;--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD COLUMN "provider_confidence" double precision;--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD COLUMN "assessment_version" text;