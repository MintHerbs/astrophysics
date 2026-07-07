/**
 * A minimal in-memory job runner for long-running local actions (chiefly the
 * MAST product download, which can take minutes over the network). This is
 * intentionally simple: a single Node process, one map in memory, no
 * persistence. It is a local developer tool, not a multi-user service.
 *
 * The job map and target-lock set are pinned to globalThis rather than a
 * plain module-level variable. In `next dev`, an API route's module can be
 * re-instantiated between requests (for example the first time a distinct
 * route like /api/jobs/[id] is hit after /api/mast/download), which would
 * otherwise silently reset a module-level Map and make a job started by one
 * request invisible to a poll from another, surfacing as a spurious 404 even
 * though the download itself completed. globalThis survives that
 * reinstantiation within the same server process.
 */

import { spawn } from "node:child_process";
import path from "node:path";

export type JobStatus = "running" | "done" | "error";

export interface Job {
  id: string;
  status: JobStatus;
  log: string[];
  startedAt: number;
  finishedAt: number | null;
  result: unknown;
  error: string | null;
}

declare global {
  // eslint-disable-next-line no-var
  var __miriJobs: Map<string, Job> | undefined;
  // eslint-disable-next-line no-var
  var __miriActiveTargets: Set<string> | undefined;
}

const jobs = globalThis.__miriJobs ?? (globalThis.__miriJobs = new Map<string, Job>());
const MAX_LOG_LINES = 800;

export function createJob(): Job {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `job-${Date.now()}-${Math.floor(Math.random() * 1e9)}`;
  const job: Job = {
    id,
    status: "running",
    log: [],
    startedAt: Date.now(),
    finishedAt: null,
    result: null,
    error: null,
  };
  jobs.set(id, job);
  return job;
}

export function getJob(id: string): Job | null {
  return jobs.get(id) ?? null;
}

export function appendLog(job: Job, chunk: string): void {
  const lines = chunk.split(/\r?\n/).filter((l) => l.length > 0);
  job.log.push(...lines);
  if (job.log.length > MAX_LOG_LINES) {
    job.log.splice(0, job.log.length - MAX_LOG_LINES);
  }
}

export function finishJob(job: Job, result: unknown): void {
  job.status = "done";
  job.result = result;
  job.finishedAt = Date.now();
}

export function failJob(job: Job, error: unknown): void {
  job.status = "error";
  job.error = error instanceof Error ? error.message : String(error);
  job.finishedAt = Date.now();
}

// Interpreter names tried in order; the repository's own docs consistently
// invoke "python", so that is tried first.
const PYTHON_CANDIDATES = ["python", "python3", "py"];

/** Run a Python script with args, streaming stdout/stderr into job.log. */
export function runPython(scriptPath: string, args: string[], cwd: string, job: Job): Promise<void> {
  return new Promise((resolve, reject) => {
    attempt(0);

    function attempt(i: number) {
      if (i >= PYTHON_CANDIDATES.length) {
        reject(new Error(`No Python interpreter found (tried: ${PYTHON_CANDIDATES.join(", ")}).`));
        return;
      }
      const exe = PYTHON_CANDIDATES[i];
      let movedOn = false;
      const child = spawn(exe, [scriptPath, ...args], { cwd });

      child.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "ENOENT" && !movedOn) {
          movedOn = true;
          attempt(i + 1);
          return;
        }
        reject(err);
      });
      child.stdout?.on("data", (d: Buffer) => appendLog(job, d.toString("utf8")));
      child.stderr?.on("data", (d: Buffer) => appendLog(job, d.toString("utf8")));
      child.on("close", (code) => {
        if (movedOn) return;
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`${path.basename(scriptPath)} exited with code ${code}.`));
        }
      });
    }
  });
}

// Prevents two overlapping downloads of the same MAST target.
const activeTargets = globalThis.__miriActiveTargets ?? (globalThis.__miriActiveTargets = new Set<string>());

export function lockTarget(target: string): boolean {
  const key = target.toLowerCase();
  if (activeTargets.has(key)) return false;
  activeTargets.add(key);
  return true;
}

export function unlockTarget(target: string): void {
  activeTargets.delete(target.toLowerCase());
}
