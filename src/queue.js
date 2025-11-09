import db from "./db.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Enqueue a new job
 */
export async function enqueueJob(jobData) {
  const id = jobData.id || uuidv4();
  const now = new Date().toISOString();

  const job = {
    id,
    command: jobData.command,
    state: "pending",
    attempts: 0,
    max_retries: jobData.max_retries || 3,
    created_at: now,
    updated_at: now,
  };

  db.prepare(
    `INSERT INTO jobs (id, command, state, attempts, max_retries, created_at, updated_at)
     VALUES (@id, @command, @state, @attempts, @max_retries, @created_at, @updated_at)`
  ).run(job);

  return id;
}

/**
 * List jobs optionally by state
 */
export async function listJobs(state) {
  let rows;
  if (state) {
    rows = db.prepare("SELECT * FROM jobs WHERE state = ?").all(state);
  } else {
    rows = db.prepare("SELECT * FROM jobs").all();
  }

  if (rows.length === 0) {
    console.log("No jobs found.");
    return;
  }

  console.table(
    rows.map((j) => ({
      id: j.id,
      command: j.command,
      state: j.state,
      attempts: j.attempts,
      max_retries: j.max_retries,
    }))
  );
}

/**
 * Fetch one pending job (for workers)
 */
export function fetchNextPendingJob() {
  const job = db
    .prepare(
      "SELECT * FROM jobs WHERE state = 'pending' ORDER BY created_at ASC LIMIT 1"
    )
    .get();

  if (!job) return null;

  db.prepare(
    "UPDATE jobs SET state = 'processing', updated_at = ? WHERE id = ?"
  ).run(new Date().toISOString(), job.id);

  return job;
}

/**
 * Update job state
 */
export function updateJobState(id, state, attempts = null) {
  db.prepare(
    "UPDATE jobs SET state = ?, attempts = COALESCE(?, attempts), updated_at = ? WHERE id = ?"
  ).run(state, attempts, new Date().toISOString(), id);
}

/**
 * Print status summary
 */
export async function getStatus() {
  const states = ["pending", "processing", "completed", "failed", "dead"];
  const summary = {};

  for (const s of states) {
    const count = db
      .prepare("SELECT COUNT(*) as c FROM jobs WHERE state = ?")
      .get(s).c;
    summary[s] = count;
  }

  console.table([summary]);
}
