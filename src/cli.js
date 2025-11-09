#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { enqueueJob, listJobs, getStatus } from "./queue.js";
import { startWorkers, stopWorkers } from "./worker.js";
import { listDLQ, retryDLQ } from "./dlq.js";

import { setConfig, getConfig } from "./config.js";

yargs(hideBin(process.argv))
  // ===================== ENQUEUE =====================
  .command(
    "enqueue <job>",
    "Add a new job to the queue",
    (yargs) =>
      yargs.positional("job", {
        type: "string",
        describe: 'Job JSON, e.g. \'{"command":"echo Hello"}\'',
      }),
    async (argv) => {
      try {
        const job = JSON.parse(argv.job);
        const id = await enqueueJob(job);
        console.log(` Job enqueued successfully with ID: ${id}`);
      } catch (err) {
        console.error("Failed to enqueue job:", err.message);
      }
    }
  )

  // ===================== WORKERS =====================
  .command(
    "worker <action>",
    "Start or stop workers",
    (yargs) =>
      yargs
        .positional("action", {
          describe: "Action to perform (start|stop)",
          type: "string",
        })
        .option("count", {
          alias: "c",
          type: "number",
          default: 1,
          describe: "Number of workers to start",
        }),
    async (argv) => {
      if (argv.action === "start") {
        await startWorkers(argv.count);
      } else if (argv.action === "stop") {
        await stopWorkers();
      } else {
        console.log("⚠️ Invalid action. Use 'start' or 'stop'.");
      }
    }
  )

  // ===================== STATUS =====================
  .command(
    "status",
    "Show summary of job states & active workers",
    async () => {
      await getStatus();
    }
  )

  // ===================== LIST JOBS =====================
  .command(
    "list",
    "List jobs by state",
    (yargs) =>
      yargs.option("state", {
        alias: "s",
        type: "string",
        describe:
          "Filter jobs by state (pending|processing|completed|failed|dead)",
      }),
    async (argv) => {
      await listJobs(argv.state);
    }
  )

  // ===================== DEAD LETTER QUEUE =====================
  .command(
    "dlq <action> [jobId]",
    "View or retry DLQ jobs",
    (yargs) =>
      yargs
        .positional("action", {
          describe: "Action (list|retry)",
          type: "string",
        })
        .positional("jobId", {
          describe: "Job ID (for retry)",
          type: "string",
        }),
    async (argv) => {
      if (argv.action === "list") {
        await listDLQ();
      } else if (argv.action === "retry" && argv.jobId) {
        await retryDLQ(argv.jobId);
      } else {
        console.log("Use 'dlq list' or 'dlq retry <jobId>'");
      }
    }
  )

  // ===================== CONFIG =====================
  .command(
    "config <action> [key] [value]",
    "Manage configuration (set|get)",
    (yargs) =>
      yargs
        .positional("action", {
          describe: "Action (set|get)",
          type: "string",
        })
        .positional("key", {
          describe: "Config key (max-retries|backoff-base)",
          type: "string",
        })
        .positional("value", {
          describe: "Value (for set)",
          type: "string",
        }),
    async (argv) => {
      if (argv.action === "set") {
        await setConfig(argv.key, argv.value);
      } else if (argv.action === "get") {
        await getConfig(argv.key);
      } else {
        console.log("Use 'config set <key> <value>' or 'config get <key>'");
      }
    }
  )

  // ===================== HELP =====================
  .demandCommand(1, "Please specify a command. Try --help for usage.")
  .help()
  .help()
  .demandCommand(1, "Please provide a valid command.").argv;
