import fs from "node:fs";
import path from "node:path";
import {
  argumentValue,
  composeArguments,
  postgresContainerId,
  run,
} from "./pilot-docker.mjs";

const backupArgument = process.argv[2]?.startsWith("--") ? undefined : process.argv[2];
if (!backupArgument || !process.argv.includes("--confirm-replace")) {
  throw new Error(
    "Usage: npm run pilot:restore -- <backup.dump> --confirm-replace [--env-file .env.pilot]",
  );
}

const backupPath = path.resolve(backupArgument);
if (!fs.statSync(backupPath).isFile()) throw new Error("The backup path must be a file.");

const envFile = argumentValue("--env-file", ".env.pilot");
const containerId = postgresContainerId(envFile);
const containerPath = `/tmp/spanish-coach-restore-${Date.now()}.dump`;

run("docker", composeArguments(envFile, "stop", "app"));
try {
  run("docker", ["cp", backupPath, `${containerId}:${containerPath}`]);
  run("docker", [
    "exec",
    containerId,
    "pg_restore",
    "--username=spanish_coach",
    "--dbname=spanish_coach",
    "--clean",
    "--if-exists",
    "--no-owner",
    "--no-privileges",
    "--exit-on-error",
    containerPath,
  ]);
} finally {
  run("docker", ["exec", containerId, "rm", "-f", containerPath]);
  run("docker", composeArguments(envFile, "start", "app"));
}

console.info(JSON.stringify({
  level: "info",
  event: "pilot_backup_restored",
  path: backupPath,
}));
