import fs from "node:fs";
import path from "node:path";
import {
  argumentValue,
  postgresContainerId,
  run,
} from "./pilot-docker.mjs";

const envFile = argumentValue("--env-file", ".env.pilot");
const outputDirectory = path.resolve(argumentValue("--output", ".backups"));
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const fileName = `spanish-coach-${timestamp}.dump`;
const outputPath = path.join(outputDirectory, fileName);
const containerPath = `/tmp/${fileName}`;

fs.mkdirSync(outputDirectory, { recursive: true });
const containerId = postgresContainerId(envFile);

try {
  run("docker", [
    "exec",
    containerId,
    "pg_dump",
    "--username=spanish_coach",
    "--dbname=spanish_coach",
    "--format=custom",
    `--file=${containerPath}`,
  ]);
  run("docker", ["cp", `${containerId}:${containerPath}`, outputPath]);
} finally {
  run("docker", ["exec", containerId, "rm", "-f", containerPath]);
}

const size = fs.statSync(outputPath).size;
if (size === 0) throw new Error("The database backup is empty.");
console.info(JSON.stringify({
  level: "info",
  event: "pilot_backup_created",
  path: outputPath,
  bytes: size,
}));
