CREATE TABLE "teacher_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"exercise_attempt_id" uuid NOT NULL,
	"provider_id" text NOT NULL,
	"provider_version" text NOT NULL,
	"generation_mode" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "teacher_feedback" ADD CONSTRAINT "teacher_feedback_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "teacher_feedback" ADD CONSTRAINT "teacher_feedback_exercise_attempt_id_exercise_attempts_id_fk" FOREIGN KEY ("exercise_attempt_id") REFERENCES "public"."exercise_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "teacher_feedback_attempt_unique" ON "teacher_feedback" USING btree ("exercise_attempt_id");--> statement-breakpoint
CREATE INDEX "teacher_feedback_learner_created_idx" ON "teacher_feedback" USING btree ("learner_id","created_at");