CREATE TABLE "lesson_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"lesson_plan_id" uuid NOT NULL,
	"lesson_key" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD COLUMN "lesson_session_id" uuid;--> statement-breakpoint
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_lesson_plan_id_lesson_plans_id_fk" FOREIGN KEY ("lesson_plan_id") REFERENCES "public"."lesson_plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lesson_session_plan_unique" ON "lesson_sessions" USING btree ("learner_id","lesson_plan_id");--> statement-breakpoint
CREATE INDEX "lesson_session_active_idx" ON "lesson_sessions" USING btree ("learner_id","status","last_activity_at");--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_lesson_session_id_lesson_sessions_id_fk" FOREIGN KEY ("lesson_session_id") REFERENCES "public"."lesson_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercise_attempt_session_idx" ON "exercise_attempts" USING btree ("lesson_session_id","occurred_at");