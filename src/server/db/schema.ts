import {
  boolean,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const a1BandEnum = pgEnum("a1_band", ["early", "mid", "strong"]);
export const skillEnum = pgEnum("learner_skill", [
  "vocabulary",
  "grammar",
  "reading",
  "listening",
  "speaking",
]);
export const assessmentStatusEnum = pgEnum("assessment_status", ["assessed", "unassessed"]);
export const learningItemKindEnum = pgEnum("learning_item_kind", [
  "word",
  "phrase",
  "construction",
  "grammar_pattern",
]);
export const exerciseModalityEnum = pgEnum("exercise_modality", [
  "recognition",
  "recall",
  "listening",
  "production",
]);

export const learners = pgTable("learners", {
  id: uuid("id").primaryKey().defaultRandom(),
  displayName: text("display_name").notNull(),
  supportLanguage: text("support_language").notNull().default("en"),
  supportLevel: text("support_level").notNull().default("B1"),
  targetLanguage: text("target_language").notNull().default("es"),
  targetVariant: text("target_variant").notNull().default("es-ES"),
  overallLevel: text("overall_level").notNull().default("A1"),
  a1Band: a1BandEnum("a1_band").notNull(),
  primaryGoal: text("primary_goal").notNull(),
  priorExperience: text("prior_experience").notNull(),
  preferredSessionMinutes: integer("preferred_session_minutes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const learnerSkillEstimates = pgTable(
  "learner_skill_estimates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    skill: skillEnum("skill").notNull(),
    cefrLevel: text("cefr_level").notNull().default("A1"),
    a1Band: a1BandEnum("a1_band"),
    status: assessmentStatusEnum("status").notNull(),
    confidence: integer("confidence").notNull().default(0),
    evidenceCount: integer("evidence_count").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("learner_skill_unique").on(table.learnerId, table.skill),
    index("learner_skill_learner_idx").on(table.learnerId),
  ],
);

export const diagnosticAttempts = pgTable(
  "diagnostic_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    version: text("version").notNull(),
    answers: jsonb("answers").$type<Record<string, string>>().notNull(),
    score: integer("score").notNull(),
    maxScore: integer("max_score").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("diagnostic_attempt_learner_idx").on(table.learnerId)],
);

export const learningItems = pgTable("learning_items", {
  id: text("id").primaryKey(),
  kind: learningItemKindEnum("kind").notNull(),
  targetText: text("target_text").notNull(),
  supportText: text("support_text").notNull(),
  cefrLevel: text("cefr_level").notNull().default("A1"),
  targetVariant: text("target_variant").notNull().default("es-ES"),
  sourceType: text("source_type").notNull(),
  sourceReference: text("source_reference").notNull(),
  license: text("license").notNull(),
  attribution: text("attribution").notNull(),
  qaStatus: text("qa_status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const learnerItemStates = pgTable(
  "learner_item_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    learningItemId: text("learning_item_id")
      .notNull()
      .references(() => learningItems.id, { onDelete: "cascade" }),
    due: timestamp("due", { withTimezone: true }).notNull(),
    stability: doublePrecision("stability").notNull(),
    difficulty: doublePrecision("difficulty").notNull(),
    elapsedDays: integer("elapsed_days").notNull(),
    scheduledDays: integer("scheduled_days").notNull(),
    learningSteps: integer("learning_steps").notNull(),
    reps: integer("reps").notNull(),
    lapses: integer("lapses").notNull(),
    state: integer("state").notNull(),
    lastReview: timestamp("last_review", { withTimezone: true }),
    recognitionEvidence: integer("recognition_evidence").notNull().default(0),
    recallEvidence: integer("recall_evidence").notNull().default(0),
    listeningEvidence: integer("listening_evidence").notNull().default(0),
    productionEvidence: integer("production_evidence").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("learner_item_state_unique").on(table.learnerId, table.learningItemId),
    index("learner_item_due_idx").on(table.learnerId, table.due),
  ],
);

export const exerciseAttempts = pgTable(
  "exercise_attempts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    learningItemId: text("learning_item_id")
      .notNull()
      .references(() => learningItems.id, { onDelete: "cascade" }),
    lessonKey: text("lesson_key").notNull(),
    exerciseId: text("exercise_id").notNull(),
    modality: exerciseModalityEnum("modality").notNull(),
    selectedOptionId: text("selected_option_id").notNull(),
    correct: boolean("correct").notNull(),
    fsrsRating: integer("fsrs_rating").notNull(),
    scheduledDue: timestamp("scheduled_due", { withTimezone: true }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("exercise_attempt_learner_lesson_idx").on(table.learnerId, table.lessonKey),
    index("exercise_attempt_item_idx").on(table.learnerId, table.learningItemId),
  ],
);

export const lessonPlans = pgTable(
  "lesson_plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    learnerId: uuid("learner_id")
      .notNull()
      .references(() => learners.id, { onDelete: "cascade" }),
    targetMinutes: integer("target_minutes").notNull(),
    estimatedMinutes: integer("estimated_minutes").notNull(),
    status: text("status").notNull().default("planned"),
    plannerVersion: text("planner_version").notNull(),
    plan: jsonb("plan").$type<{
      rationale: string[];
      blocks: Array<{
        id: string;
        kind: string;
        title: string;
        objective: string;
        estimatedSeconds: number;
        source: string;
        availability: string;
      }>;
    }>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("lesson_plan_learner_created_idx").on(table.learnerId, table.createdAt)],
);

export type Learner = typeof learners.$inferSelect;
export type NewLearner = typeof learners.$inferInsert;
