CREATE TABLE "pilot_feedback" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"lesson_session_id" uuid NOT NULL,
	"overall_rating" integer NOT NULL,
	"pacing" text NOT NULL,
	"reading_time" text NOT NULL,
	"microphone_capture" text NOT NULL,
	"comment" text,
	"app_version" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pilot_feedback" ADD CONSTRAINT "pilot_feedback_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pilot_feedback" ADD CONSTRAINT "pilot_feedback_lesson_session_id_lesson_sessions_id_fk" FOREIGN KEY ("lesson_session_id") REFERENCES "public"."lesson_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "pilot_feedback_session_unique" ON "pilot_feedback" USING btree ("lesson_session_id");--> statement-breakpoint
CREATE INDEX "pilot_feedback_learner_created_idx" ON "pilot_feedback" USING btree ("learner_id","created_at");