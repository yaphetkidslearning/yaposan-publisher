import { loadCloudConfig } from "./config";
import { getDatabase } from "./database";
import { createObjectStorage } from "./storageFactory";
import {
  claimNextProductPhotoBatch,
  cleanupExpiredProductPhotoBatches,
  processProductPhotoBatch,
  recoverStaleProductPhotoBatches,
} from "./productPhotoBatches";

async function main() {
  const config = loadCloudConfig();
  const db = await getDatabase();
  const storage = createObjectStorage(config);
  let stopping = false;

  process.on("SIGINT", () => { stopping = true; });
  process.on("SIGTERM", () => { stopping = true; });

  try {
    while (!stopping) {
      try {
        await recoverStaleProductPhotoBatches(db);
        await cleanupExpiredProductPhotoBatches(db, storage);
        const job = await claimNextProductPhotoBatch(
          db,
          config.productPhotoWorkerId,
          config.productPhotoJobLeaseSeconds,
        );
        if (job) {
          await processProductPhotoBatch(db, storage, job);
        } else {
          await new Promise((resolve) => setTimeout(resolve, config.productPhotoWorkerPollMs));
        }
      } catch (error) {
        console.error("[product-photo-worker] processing error", error);
        await new Promise((resolve) =>
          setTimeout(resolve, Math.max(1000, config.productPhotoWorkerPollMs)),
        );
      }
    }
  } finally {
    await db.close();
  }
}

main().catch((error) => {
  console.error("[product-photo-worker] fatal error", error);
  process.exit(1);
});
