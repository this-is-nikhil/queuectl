import { exec } from "child_process";
import { fetchNextPendingJob, updateJobState } from "./queue.js";
import db from "./db.js";
import { getConfigValue } from "./config.js";

/**
 * Run a single job (command execution + retry handling)
 */
function executeJob(job) {
  return new Promise((resolve) => {
    console.log(`👷 Worker started job ${job.id}: ${job.command}`);

    const process = exec(job.command, (error) => {
      if (error) {
        console.log(`Job ${job.id} failed: ${error.message}`);
        resolve(false);
      } else {
        console.log(`Job ${job.id} completed successfully.`);
        resolve(true);
      }
    });

    process.stdout?.on("data", (data) => process.stdout.write(data));
    process.stderr?.on("data", (data) => process.stderr.write(data));
  });
}

/**
 * Start worker processes
 */
export async function startWorkers(count = 1) {
  console.log(`Starting ${count} worker(s)...`);

  for (let i = 0; i < count; i++) {
    runWorker(i + 1);
  }
}

/**
 * Worker loop
 */
async function runWorker(workerId) {
  const backoffBase = await getConfigValue("backoff-base");
  const maxRetriesDefault = await getConfigValue("max-retries");

  while (true) {
    const job = fetchNextPendingJob();
    if (!job) {
      await sleep(2000);
      continue;
    }

    updateJobState(job.id, "processing");

    const success = await executeJob(job);

    if (success) {
      updateJobState(job.id, "completed");
    } else {
      const attempts = job.attempts + 1;
      if (attempts <= (job.max_retries || maxRetriesDefault)) {
        const delay = Math.pow(backoffBase, attempts) * 1000;
        console.log(
          `🔁 Retrying job ${job.id} after ${
            delay / 1000
          }s (attempt ${attempts})`
        );

        updateJobState(job.id, "failed", attempts);
        setTimeout(() => {
          db.prepare("UPDATE jobs SET state = 'pending' WHERE id = ?").run(
            job.id
          );
        }, delay);
      } else {
        console.log(
          `💀 Job ${job.id} moved to DLQ after ${attempts - 1} failed attempts.`
        );
        updateJobState(job.id, "dead", attempts);
        db.prepare(
          `INSERT OR REPLACE INTO dlq (id, command, attempts, created_at)
           VALUES (?, ?, ?, ?)`
        ).run(job.id, job.command, attempts, new Date().toISOString());
      }
    }
  }
}

/**
 * Graceful stop (not used yet but ready for future)
 */
export async function stopWorkers() {
  console.log("Stopping workers gracefully...");
  process.exit(0);
}

/**
 * Helper sleep
 */
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
