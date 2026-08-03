export type MarketplaceChannel = "ebay" | "etsy" | "shopify" | "amazon" | "facebook" | "instagram" | "tiktok" | "walmart" | "pinterest";
export type ConnectionStatus = "disconnected" | "configured" | "connected" | "error";

export type MarketplaceConnection = {
  channel: MarketplaceChannel;
  status: ConnectionStatus;
  accountName?: string;
  lastSyncAt?: number;
  error?: string;
};

export type MarketplacePreset = {
  channel: MarketplaceChannel;
  label: string;
  titleLimit: number;
  descriptionLimit: number;
  maxImages: number;
  requiredFields: (keyof ProductListing)[];
  supportsLocalSimulation: true;
};

export type ProductListing = {
  id: string;
  title: string;
  description: string;
  price: number;
  quantity: number;
  sku: string;
  category: string;
  tags: string[];
  imageUris: string[];
  channels: MarketplaceChannel[];
  status: "draft" | "ready" | "published" | "failed";
  createdAt: number;
  updatedAt: number;
};

export type ListingBatchJob = {
  id: string;
  listingIds: string[];
  channels: MarketplaceChannel[];
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  createdAt: number;
  completedAt?: number;
  results: { listingId: string; channel: MarketplaceChannel; success: boolean; externalId?: string; error?: string }[];
};

export type CommerceMetrics = {
  totalListings: number;
  readyListings: number;
  publishedListings: number;
  failedListings: number;
  totalInventoryValue: number;
  channelCounts: Record<MarketplaceChannel, number>;
};

export type CommercePackageManifest = {
  schema: "yaposan-commerce-package";
  version: 1;
  exportedAt: number;
  listingCount: number;
  channels: MarketplaceChannel[];
  listings: ProductListing[];
};

export type CommerceStudioState = {
  listings: ProductListing[];
  connections: MarketplaceConnection[];
  jobs: ListingBatchJob[];
};
