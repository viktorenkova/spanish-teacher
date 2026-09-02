---
name: core
description: Purpose, entry points, module map, and invariants of the Spanish Coach app
---

Spanish Coach: adaptive A1 Spanish coach (es-ES), single local user; English B1 is support language only. Next.js app router, single page + route handlers (modular monolith). MVP-0 loop: plan -> exercises (recognition/recall/listening/production) -> attempts -> deterministic teacher feedback -> mistake memory -> FSRS reviews -> learner progress.

Entry points:
- UI: src/app/page.tsx -> components/coach-experience.tsx (CoachExperience, "use client") -> onboarding-experience | local-profile-chooser | planned-lesson-experience (+ lesson-experience, pilot-feedback-form, learner-overview-card, lesson-history-card, practice-rhythm-card).
- Browser: src/browser/local-learner-profiles.ts; localStorage keys spanish-coach:learner-id:v1, spanish-coach:learner-profiles:v1 (learner id(s) only).
- API (16 handlers, src/app/api/**/route.ts): health/{live,ready}, onboarding, learner/{profile,overview,history,rhythm}, lesson/{plan,sessions,attempts,speaking-attempts,progress}, mistakes, teacher/feedback, tts/[clipId], pilot-feedback.
- Server: src/server/<area>/service.ts for db, config, observability, health, lesson-sessions, lesson-planner, mistakes, review, teacher, learner-overview, lesson-history, practice-rhythm, pilot-feedback.
- Domain: src/domain/*.ts (pure TS, co-located tests): lesson (keys introductions-v1, daily-routines-v1, cafe-ordering-v1), lesson-planner, lesson-session, diagnostic, mistake, progress, speaking, listening, practice-rhythm, lesson-history, learner-overview, learner-profile, pilot-feedback.
- DB: src/server/db/schema.ts (Drizzle): learners, learner_skill_estimates, diagnostic_attempts, learning_items, learner_item_states (one FSRS card per learner+item), exercise_attempts (references item; nullable lesson_session_id), teacher_feedback, learner_mistakes, mistake_events, lesson_plans, lesson_sessions, pilot_feedback. Migrations drizzle/0000..0007.
- Provider ports: src/stt/provider.ts (SpeechToTextProvider; browser es-ES), src/tts/provider.ts (TtsProvider; piper sidecar or browser fallback + .data/tts-cache), src/teacher/provider.ts (TeacherProvider; deterministic impl, generationMode deterministic|language-model).

Invariants: PostgreSQL is system of record; browser stores only learner id(s); attempt != learning item; plan != session (resume at first incomplete exercise); scheduling only via ts-fsrs; mistake aggregates active/improving/resolved (recurrence resets evidence, 2 correct examples -> resolved); teacher corrections carry stable codes; raw audio not retained (transcript kept); no pronunciation scoring from transcription alone.
