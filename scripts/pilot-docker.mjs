import { spawnSync } from "node:child_process";
import path from "node:path";

export const composeFile = path.resolve("compose.pilot.yaml");

export function argumentValue(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index === -1) return fallback;
  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${flag} requires a value.`);
  return value;
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = options.capture ? (result.stderr || result.stdout || "").trim() : "";
    throw new Error(`${command} failed with exit code ${result.status}${detail ? `: ${detail}` : ""}.`);
  }
  return options.capture ? result.stdout.trim() : "";
}

export function composeArguments(envFile, ...args) {
  return ["compose", "--env-file", path.resolve(envFile), "-f", composeFile, ...args];
}

export function postgresContainerId(envFile) {
  const containerId = run(
    "docker",
    composeArguments(envFile, "ps", "-q", "postgres"),
    { capture: true },
  );
  if (!containerId) throw new Error("The pilot PostgreSQL container is not running.");
  return containerId;
}
