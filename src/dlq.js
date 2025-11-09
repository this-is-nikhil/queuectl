import db from "./db.js";
import { enqueueJob } from "./queue.js";

/**
 * List all jobs in the DLQ
 */
export async function listDLQ() {
  const rows = db.prepare("SELECT * FROM dlq").all();

  if (rows.length === 0) {
    console.log("✅ DLQ is empty!");
    return;
  }

  console.table(
    rows.map((j) => ({
      id: j.id,
      command: j.command,
      attempts: j.attempts,
    }))
  );
}

/**
 * Retry all jobs in the DLQ
 */
export async function retryDLQ() {
  const rows = db.prepare("SELECT * FROM dlq").all();

  if (rows.length === 0) {
    console.log("✅ Nothing to retry — DLQ is empty.");
    return;
  }

  for (const job of rows) {
    console.log(`🔁 Retrying job ${job.id}...`);
    await enqueueJob({ command: job.command });
    db.prepare("DELETE FROM dlq WHERE id = ?").run(job.id);
  }

  console.log("🎯 All DLQ jobs re-enqueued successfully!");
}
