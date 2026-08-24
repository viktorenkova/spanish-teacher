CREATE TABLE "learner_mistakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"learning_item_id" text NOT NULL,
	"code" text NOT NULL,
	"category" text NOT NULL,
	"target_pattern" text NOT NULL,
	"explanation" text NOT NULL,
	"status" text NOT NULL,
	"occurrence_count" integer NOT NULL,
	"successful_evidence_count" integer NOT NULL,
	"first_seen_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone NOT NULL,
	"resolved_at" timestamp with time zone,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mistake_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mistake_id" uuid NOT NULL,
	"exercise_attempt_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learner_mistakes" ADD CONSTRAINT "learner_mistakes_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_mistakes" ADD CONSTRAINT "learner_mistakes_learning_item_id_learning_items_id_fk" FOREIGN KEY ("learning_item_id") REFERENCES "public"."learning_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mistake_events" ADD CONSTRAINT "mistake_events_mistake_id_learner_mistakes_id_fk" FOREIGN KEY ("mistake_id") REFERENCES "public"."learner_mistakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mistake_events" ADD CONSTRAINT "mistake_events_exercise_attempt_id_exercise_attempts_id_fk" FOREIGN KEY ("exercise_attempt_id") REFERENCES "public"."exercise_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "learner_mistake_unique" ON "learner_mistakes" USING btree ("learner_id","learning_item_id","code");--> statement-breakpoint
CREATE INDEX "learner_mistake_status_idx" ON "learner_mistakes" USING btree ("learner_id","status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "mistake_event_unique" ON "mistake_events" USING btree ("mistake_id","exercise_attempt_id","kind");--> statement-breakpoint
CREATE INDEX "mistake_event_mistake_created_idx" ON "mistake_events" USING btree ("mistake_id","created_at");