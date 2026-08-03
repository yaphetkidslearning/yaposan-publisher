import { getDatabase } from "../server/database.ts";
import { loadCloudConfig } from "../server/config.ts";
import { createObjectStorage } from "../server/storageFactory.ts";
import { executeExportJob } from "../server/exportExecutor.ts";
import { claimNextExportJob, recoverStaleExportJobs, updateExportJob } from "../server/productionExport.ts";

const config = loadCloudConfig();
const workerId = config.exportWorkerId;
const leaseSeconds = config.exportJobLeaseSeconds;
const sleep = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));
let stopping = false;
process.on("SIGTERM", () => { stopping = true; });
process.on("SIGINT", () => { stopping = true; });

async function run() {
  const db = await getDatabase();
  const storage = createObjectStorage(config);
  await recoverStaleExportJobs(db);
  console.log(JSON.stringify({ level: "info", message: "Yaposan RC6 export worker started", workerId, leaseSeconds, storageDriver: config.storageDriver }));
  while (!stopping) {
    const job = await claimNextExportJob(db, workerId, leaseSeconds);
    if (!job) { await sleep(config.exportWorkerPollMs); continue; }
    const heartbeat = setInterval(() => {
      void updateExportJob(db, job.id, { workerId, leaseSeconds }).catch(error => console.error(JSON.stringify({level:"error",message:"Export heartbeat failed",jobId:job.id,error:String(error)})));
    }, Math.max(1000, Math.floor(leaseSeconds * 500)));
    try {
      await updateExportJob(db, job.id, { progress: 10, workerId, leaseSeconds });
      const result = await executeExportJob(db, storage, job, { ffmpegPath: config.ffmpegPath, timeoutMs: config.rendererTimeoutMs });
      await updateExportJob(db, job.id, { progress: 100, status: "succeeded", result, workerId });
      console.log(JSON.stringify({ level: "info", message: "Export rendered and published", jobId: job.id, artifacts: result.artifacts.map(x => x.key) }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown export error";
      await updateExportJob(db, job.id, { status: "failed", error: message, workerId });
      console.error(JSON.stringify({ level: "error", message: "Export failed", jobId: job.id, error: message }));
    } finally { clearInterval(heartbeat); }
  }
  console.log(JSON.stringify({ level: "info", message: "Yaposan RC6 export worker stopped" }));
}
run().catch(error => { console.error(error); process.exitCode = 1; });
