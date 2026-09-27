# Next A1 lessons · implementation plan

Status: lessons 13–14 implemented locally; unit, lint, production-build, and mocked browser-flow checks passed. A database-backed end-to-end run and deployment remain separate verification steps.

## Baseline and scope

The existing deterministic path has 12 lessons and ends with weather. Extend it with two short, project-authored A1 lessons without changing completed exercise IDs, stored progress, the lesson-session model, or the FSRS scheduler.

13. **At home** — name a room and say where an everyday object is. Target: `Está en…`, `encima de…`, and `debajo de…` in simple home contexts.
14. **Work and study** — say whether you work or study and give one place or subject. Target: `Trabajo en…`, `Estudio…`, and a simple workplace/school detail.

These are conversation-oriented extensions of the current A1 sequence, not a move to A2. Future batches can add more everyday contexts after these two lessons, then validate the A1→A2 transition separately.

## Implementation order

1. Add stable lesson keys at the end of the curriculum array; leave all 12 existing keys and exercise IDs untouched.
2. For each lesson, write a focused teaching module before its first recognition check. Teach every essential new pattern needed for recall, listening, and speaking; keep English at B1 level.
3. Add recognition, phrase retrieval, listening, and speaking exercises with distinct learning-item IDs, project-authored provenance, and `es-ES` clips. Keep speech assessment deterministic and describe it as transcript-based task completion, never pronunciation scoring.
4. Add planner metadata, completion copy, and curriculum documentation. Update topic-count assertions that intentionally cover the full catalogue.
5. Test teaching order, clip references, speaking success/failure and the transition from weather to the two new topics. Run lint, unit tests, typecheck/build and focused browser checks where available.

## Acceptance

- An existing learner who completes weather is offered **At home**, then **Work and study**; older progress remains valid.
- Each lesson can be completed in the current UI with listening and speaking (typed fallback remains available without speaking credit).
- New phrases enter persisted review through the existing attempt flow.
- The teaching sequence validator passes and review items retain their source metadata.
