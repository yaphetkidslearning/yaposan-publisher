import type { CloudConfig } from "./config.ts";
import { LocalObjectStorage, R2ObjectStorage, type ObjectStorage } from "./storage.ts";

export function createObjectStorage(config: CloudConfig): ObjectStorage {
  if (config.storageDriver === "r2") {
    if (!config.storageEndpoint || !config.r2AccessKeyId || !config.r2SecretAccessKey) throw new Error("R2_STORAGE_NOT_CONFIGURED");
    return new R2ObjectStorage({
      endpoint: config.storageEndpoint,
      bucket: config.storageBucket,
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey,
      region: config.r2SigningRegion,
      publicBaseUrl: config.publicAssetBaseUrl,
    });
  }
  if (config.storageDriver !== "local") throw new Error(`STORAGE_DRIVER_NOT_IMPLEMENTED_${config.storageDriver.toUpperCase()}`);
  return new LocalObjectStorage(config.localStorageRoot, config.publicAssetBaseUrl);
}
