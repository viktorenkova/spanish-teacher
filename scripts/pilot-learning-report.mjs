import { argumentValue, postgresContainerId, run } from "./pilot-docker.mjs";

function parseWindowDays() {
  const rawValue = argumentValue("--days", "30");
  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 1 || value > 365) {
    throw new Error("--days must be a whole number from 1 to 365.");
  }
  return value;
}

const envFile = argumentValue("--env-file", ".env.pilot");
const windowDays = parseWindowDays();
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
const windowInterval = `make_interval(days => ${windowDays})`;

function query(command) {
  return run("docker", [...psql, "--command", command], { capture: true });
}

const overview = query(`
  WITH sessions AS (
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE status = 'completed') AS completed,
      count(*) FILTER (WHERE status = 'abandoned') AS abandoned,
      count(*) FILTER (WHERE status = 'active') AS active
    FROM lesson_sessions
    WHERE started_at >= now() - ${windowInterval}
  ), attempts AS (
    SELECT
      count(*) AS total,
      count(*) FILTER (WHERE correct) AS correct,
      count(*) FILTER (WHERE modality = 'production') AS speaking,
      count(*) FILTER (WHERE modality = 'production' AND correct) AS speaking_complete
    FROM exercise_attempts
    WHERE occurred_at >= now() - ${windowInterval}
  )
  SELECT
    (SELECT count(*) FROM learners) AS learners,
    sessions.total AS sessions,
    sessions.completed,
    sessions.abandoned,
    sessions.active,
    round(100.0 * sessions.completed / nullif(sessions.completed + sessions.abandoned, 0), 1)
      AS closed_completion_pct,
    attempts.total AS attempts,
    round(100.0 * attempts.correct / nullif(attempts.total, 0), 1) AS accuracy_pct,
    attempts.speaking AS speaking_attempts,
    round(100.0 * attempts.speaking_complete / nullif(attempts.speaking, 0), 1)
      AS speaking_completion_pct
  FROM sessions CROSS JOIN attempts;
`);

const learners = query(`
  WITH session_stats AS (
    SELECT
      learner_id,
      count(*) FILTER (WHERE status = 'completed') AS completed,
      count(*) FILTER (WHERE status = 'abandoned') AS abandoned,
      max(last_activity_at) AS last_practice
    FROM lesson_sessions
    GROUP BY learner_id
  ), attempt_stats AS (
    SELECT
      learner_id,
      count(*) AS attempts,
      count(*) FILTER (WHERE correct) AS correct,
      count(*) FILTER (WHERE modality = 'production') AS speaking,
      count(*) FILTER (WHERE modality = 'production' AND correct) AS speaking_complete
    FROM exercise_attempts
    GROUP BY learner_id
  ), review_stats AS (
    SELECT
      learner_id,
      count(*) AS review_items,
      count(*) FILTER (WHERE due <= now()) AS due_now
    FROM learner_item_states
    GROUP BY learner_id
  ), mistake_stats AS (
    SELECT
      learner_id,
      count(*) FILTER (WHERE status IN ('active', 'improving')) AS open_mistakes
    FROM learner_mistakes
    GROUP BY learner_id
  )
  SELECT
    l.display_name AS learner,
    coalesce(s.completed, 0) AS completed,
    coalesce(s.abandoned, 0) AS abandoned,
    coalesce(a.attempts, 0) AS attempts,
    round(100.0 * a.correct / nullif(a.attempts, 0), 1) AS accuracy_pct,
    coalesce(a.speaking_complete, 0) || '/' || coalesce(a.speaking, 0) AS speaking_complete,
    coalesce(r.due_now, 0) || '/' || coalesce(r.review_items, 0) AS due_reviews,
    coalesce(m.open_mistakes, 0) AS open_mistakes,
    s.last_practice::date AS last_practice
  FROM learners l
  LEFT JOIN session_stats s ON s.learner_id = l.id
  LEFT JOIN attempt_stats a ON a.learner_id = l.id
  LEFT JOIN review_stats r ON r.learner_id = l.id
  LEFT JOIN mistake_stats m ON m.learner_id = l.id
  ORDER BY s.last_practice DESC NULLS LAST, l.created_at;
`);

const topics = query(`
  WITH topics(lesson_key, topic_order) AS (
    VALUES
      ('introductions-v1', 1),
      ('daily-routines-v1', 2),
      ('cafe-ordering-v1', 3)
  ), session_stats AS (
    SELECT
      lesson_key,
      count(*) AS sessions,
      count(*) FILTER (WHERE status = 'completed') AS completed,
      count(*) FILTER (WHERE status = 'abandoned') AS abandoned
    FROM lesson_sessions
    WHERE started_at >= now() - ${windowInterval}
    GROUP BY lesson_key
  ), attempt_stats AS (
    SELECT
      lesson_key,
      count(*) AS attempts,
      count(*) FILTER (WHERE correct) AS correct,
      count(*) FILTER (WHERE modality = 'production') AS speaking,
      count(*) FILTER (WHERE modality = 'production' AND correct) AS speaking_complete
    FROM exercise_attempts
    WHERE occurred_at >= now() - ${windowInterval}
    GROUP BY lesson_key
  )
  SELECT
    t.lesson_key,
    coalesce(s.sessions, 0) AS sessions,
    coalesce(s.completed, 0) AS completed,
    coalesce(s.abandoned, 0) AS abandoned,
    coalesce(a.attempts, 0) AS attempts,
    round(100.0 * a.correct / nullif(a.attempts, 0), 1) AS accuracy_pct,
    coalesce(a.speaking_complete, 0) || '/' || coalesce(a.speaking, 0) AS speaking_complete
  FROM topics t
  LEFT JOIN session_stats s ON s.lesson_key = t.lesson_key
  LEFT JOIN attempt_stats a ON a.lesson_key = t.lesson_key
  ORDER BY t.topic_order;
`);

const recentSessions = query(`
  WITH attempt_stats AS (
    SELECT
      lesson_session_id,
      count(*) AS attempts,
      count(*) FILTER (WHERE correct) AS correct
    FROM exercise_attempts
    WHERE lesson_session_id IS NOT NULL
    GROUP BY lesson_session_id
  )
  SELECT
    ls.started_at::date AS date,
    l.display_name AS learner,
    ls.lesson_key,
    ls.status,
    CASE
      WHEN ls.status = 'active' THEN NULL
      ELSE greatest(0, round(extract(epoch FROM
        (coalesce(ls.completed_at, ls.last_activity_at) - ls.started_at)) / 60.0))
    END AS minutes,
    coalesce(a.correct, 0) || '/' || coalesce(a.attempts, 0) AS correct_attempts,
    pf.overall_rating AS rating,
    pf.app_version
  FROM lesson_sessions ls
  JOIN learners l ON l.id = ls.learner_id
  LEFT JOIN attempt_stats a ON a.lesson_session_id = ls.id
  LEFT JOIN pilot_feedback pf ON pf.lesson_session_id = ls.id
  WHERE ls.started_at >= now() - ${windowInterval}
  ORDER BY ls.started_at DESC
  LIMIT 20;
`);

console.info(`Pilot learning report · last ${windowDays} days\n`);
console.info("Overview\n");
console.info(overview);
console.info("\nLearner state · all time\n");
console.info(learners);
console.info(`\nTopics · last ${windowDays} days\n`);
console.info(topics);
console.info(`\nRecent sessions · last ${windowDays} days\n`);
console.info(recentSessions);
