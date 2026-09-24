CREATE TYPE "public"."journey_choice" AS ENUM('next_lesson', 'review');--> statement-breakpoint
CREATE TABLE "learning_journey_choices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"lesson_session_id" uuid NOT NULL,
	"choice" "journey_choice" NOT NULL,
	"selected_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_journey_choices" ADD CONSTRAINT "learning_journey_choices_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_journey_choices" ADD CONSTRAINT "learning_journey_choices_lesson_session_id_lesson_sessions_id_fk" FOREIGN KEY ("lesson_session_id") REFERENCES "public"."lesson_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learning_journey_choice_session_unique" ON "learning_journey_choices" USING btree ("lesson_session_id","choice");--> statement-breakpoint
CREATE INDEX "learning_journey_choice_selected_idx" ON "learning_journey_choices" USING btree ("selected_at");