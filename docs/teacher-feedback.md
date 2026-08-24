# Teacher feedback provider

The lesson application consumes a structured `TeacherProvider` interface rather
than rendering unvalidated free-form model output. A provider receives the
reviewed objective, transcript, deterministic task assessment, target locale and
level, and support-language level. It returns:

- a short summary;
- specific praise;
- zero or more corrections with suggestions and explanations;
- one next practice step;
- provider identity, version, and generation mode.

## Current provider

`local-teacher` is deterministic and covers the first A1 introduction task. It
can identify missing name/origin constructions and two common patterns (`Mi
llamo…` and `Soy <place>`). It does not claim to be a language model, make broad
grammar judgments, or assess pronunciation. This makes the feedback path useful,
testable, offline, and free of additional data transfer.

Every correction also carries a stable mistake code and category. Generated
responses are persisted separately from the exercise attempt and can be restored
after reload. The provider version makes previous output auditable when rules
change, while stable codes feed long-term mistake memory.

## External LLM decision gate

No external LLM adapter is selected in this stage. Adding one requires an
explicit product decision covering:

- provider and model;
- transcript privacy and retention;
- regional availability and credentials;
- latency, rate limits, and fallback behavior;
- per-lesson cost budget;
- structured-output validation and safety evaluation.

Once those choices are approved, the adapter should implement the existing
`TeacherProvider` contract. Deterministic task completion and FSRS scheduling
must remain outside the model.
