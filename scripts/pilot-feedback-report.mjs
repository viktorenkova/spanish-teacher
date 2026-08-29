import { argumentValue, postgresContainerId, run } from "./pilot-docker.mjs";

const envFile = argumentValue("--env-file", ".env.pilot");
const containerId = postgresContainerId(envFile);
const psql = [
  "exec",
  containerId,
  "psql",
  "--username=spanish_coach",
  "--dbname=spanish_coach",
  "--pset=footer=off",
  "--pset=null=—",
];

const summary = run("docker", [
  ...psql,
  "--command",
  `SELECT
    count(*) AS responses,
    round(avg(overall_rating), 1) AS avg_rating,
    count(*) FILTER (WHERE pacing = 'too_fast') AS too_fast,
    count(*) FILTER (WHERE reading_time != 'enough') AS reading_time_issues,
    count(*) FILTER (WHERE microphone_capture IN ('partial', 'missed')) AS microphone_issues
  FROM pilot_feedback;`,
], { capture: true });

const recent = run("docker", [
  ...psql,
  "--command",
  `SELECT
    pf.created_at::date AS date,
    l.display_name AS learner,
    ls.lesson_key,
    pf.overall_rating AS rating,
    pf.pacing,
    pf.reading_time,
    pf.microphone_capture,
    left(regexp_replace(coalesce(pf.comment, ''), '[[:space:]]+', ' ', 'g'), 120) AS comment
  FROM pilot_feedback pf
  JOIN learners l ON l.id = pf.learner_id
  JOIN lesson_sessions ls ON ls.id = pf.lesson_session_id
  ORDER BY pf.created_at DESC
  LIMIT 20;`,
], { capture: true });

console.info("Pilot feedback summary\n");
console.info(summary);
console.info("\nLatest responses\n");
console.info(recent);
