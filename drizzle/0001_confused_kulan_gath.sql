CREATE TYPE "public"."exercise_modality" AS ENUM('recognition', 'recall', 'listening', 'production');--> statement-breakpoint
CREATE TYPE "public"."learning_item_kind" AS ENUM('word', 'phrase', 'construction', 'grammar_pattern');--> statement-breakpoint
CREATE TABLE "exercise_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"learning_item_id" text NOT NULL,
	"lesson_key" text NOT NULL,
	"exercise_id" text NOT NULL,
	"modality" "exercise_modality" NOT NULL,
	"selected_option_id" text NOT NULL,
	"correct" boolean NOT NULL,
	"fsrs_rating" integer NOT NULL,
	"scheduled_due" timestamp with time zone NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learner_item_states" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"learner_id" uuid NOT NULL,
	"learning_item_id" text NOT NULL,
	"due" timestamp with time zone NOT NULL,
	"stability" double precision NOT NULL,
	"difficulty" double precision NOT NULL,
	"elapsed_days" integer NOT NULL,
	"scheduled_days" integer NOT NULL,
	"learning_steps" integer NOT NULL,
	"reps" integer NOT NULL,
	"lapses" integer NOT NULL,
	"state" integer NOT NULL,
	"last_review" timestamp with time zone,
	"recognition_evidence" integer DEFAULT 0 NOT NULL,
	"recall_evidence" integer DEFAULT 0 NOT NULL,
	"listening_evidence" integer DEFAULT 0 NOT NULL,
	"production_evidence" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_items" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "learning_item_kind" NOT NULL,
	"target_text" text NOT NULL,
	"support_text" text NOT NULL,
	"cefr_level" text DEFAULT 'A1' NOT NULL,
	"target_variant" text DEFAULT 'es-ES' NOT NULL,
	"source_type" text NOT NULL,
	"source_reference" text NOT NULL,
	"license" text NOT NULL,
	"attribution" text NOT NULL,
	"qa_status" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exercise_attempts" ADD CONSTRAINT "exercise_attempts_learning_item_id_learning_items_id_fk" FOREIGN KEY ("learning_item_id") REFERENCES "public"."learning_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_item_states" ADD CONSTRAINT "learner_item_states_learner_id_learners_id_fk" FOREIGN KEY ("learner_id") REFERENCES "public"."learners"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learner_item_states" ADD CONSTRAINT "learner_item_states_learning_item_id_learning_items_id_fk" FOREIGN KEY ("learning_item_id") REFERENCES "public"."learning_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercise_attempt_learner_lesson_idx" ON "exercise_attempts" USING btree ("learner_id","lesson_key");--> statement-breakpoint
CREATE INDEX "exercise_attempt_item_idx" ON "exercise_attempts" USING btree ("learner_id","learning_item_id");--> statement-breakpoint
CREATE UNIQUE INDEX "learner_item_state_unique" ON "learner_item_states" USING btree ("learner_id","learning_item_id");--> statement-breakpoint
CREATE INDEX "learner_item_due_idx" ON "learner_item_states" USING btree ("learner_id","due");