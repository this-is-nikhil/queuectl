# QueueCTL — Background Job Queue System (Node.js CLI)

## 📘 Overview

**QueueCTL** is a CLI-based background job queue system built with Node.js.  
It allows you to enqueue shell commands as jobs, process them using worker processes, handle retries with exponential backoff, and maintain a **Dead Letter Queue (DLQ)** for failed jobs.

This project is made as part of the **QueueCTL Backend Developer Internship Assignment**.

---

## Features

✅ CLI-based job management  
✅ Persistent job storage using JSON files  
✅ Background workers to process jobs  
✅ Retry mechanism with **exponential backoff**  
✅ Dead Letter Queue (DLQ) for permanently failed jobs  
✅ Simple commands to check job status and view the queue

---

## Tech Stack

**Node.js**
**Yargs** (for CLI)
**Child Process** (for executing shell commands)
**File System (fs)** for job persistence

---

## Project Structure

queuectl/
├── package.json
├── src/
│ ├── cli.js # Command-line interface
│ ├── queue.js # Job queue logic
│ ├── worker.js # Worker process to execute jobs
│ ├── dlq.js # Dead Letter Queue management
│ └── utils/
│ └── storage.js # File-based job storage
└── README.md

---

## 🧰 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/queuectl.git
   cd queuectl
   ```

---

## 🧰 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<your-username>/queuectl.git
   cd queuectl
   Install dependencies:
   npm install
   Make sure your Node version is v18 or higher (recommended v22+).
   🧑‍💻 Usage
   Run all commands from the project root.
   🟢 Enqueue a job
   node src/cli.js enqueue "echo Hello QueueCTL"
   ⚙️ Start worker(s)
   node src/cli.js start-workers 1
   📜 List all jobs
   node src/cli.js list
   📊 Show queue status
   node src/cli.js status
   🧾 View Dead Letter Queue (DLQ)
   node src/cli.js dlq
   🔁 Retry a failed DLQ job
   node src/cli.js retry-dlq <jobId>
   🔄 Retry & Backoff Logic
   Each job retries up to 3 times before being moved to the DLQ.
   Retry intervals follow exponential backoff:
   1st retry → 2s
   2nd retry → 4s
   3rd retry → 8s
   💀 Dead Letter Queue (DLQ)
   Jobs that fail after all retry attempts are sent to the DLQ.
   You can view them using:
   node src/cli.js dlq
   And retry them manually using:
   node src/cli.js retry-dlq <jobId>
   ```

📦 Example Workflow
node src/cli.js enqueue "echo Processing file..."
node src/cli.js enqueue "ls -la"
node src/cli.js start-workers 2
node src/cli.js list
node src/cli.js status
