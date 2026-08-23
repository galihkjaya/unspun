// Single-terminal dev runner: FastAPI on :8000 + Next.js on :3000.
// Either process dying tears down both; Ctrl+C reaches both children.

import { spawn } from "node:child_process";
import process from "node:process";

const procs = [];

function prefix(label, stream) {
  return (data) => {
    for (const line of data.toString().split("\n")) {
      if (line) stream.write(`[${label}] ${line}\n`);
    }
  };
}

function run(label, command, args) {
  const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] });
  const out = prefix(label, process.stdout);
  const err = prefix(label, process.stderr);
  child.stdout.on("data", out);
  child.stderr.on("data", err);
  child.on("exit", (code, signal) => shutdown(code ?? (signal ? 1 : 0)));
  procs.push(child);
  return child;
}

let shuttingDown = false;
function shutdown(code) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of procs) child.kill("SIGTERM");
  setTimeout(() => {
    for (const child of procs) child.kill("SIGKILL");
    process.exit(code);
  }, 1500).unref();
}

for (const sig of ["SIGINT", "SIGTERM"]) process.on(sig, () => shutdown(0));

run("api", "./.venv/bin/uvicorn", [
  "api.index:app",
  "--reload",
  "--port",
  "8000",
  "--env-file",
  ".env.local",
]);
run("web", "node_modules/.bin/next", ["dev"]);
