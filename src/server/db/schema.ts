import {
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

export type Learner = typeof learners.$inferSelect;
export type NewLearner = typeof learners.$inferInsert;

