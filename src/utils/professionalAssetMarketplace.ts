export type Phase47AssetType = "icon" | "illustration" | "photo" | "video" | "audio" | "font" | "frame" | "background" | "sticker" | "mockup";
export type Phase47License = "free" | "pro" | "enterprise" | "creator";
export type Phase47AssetStatus = "draft" | "review" | "published" | "rejected";

export type Phase47Asset = {
  id: string;
  title: string;
  type: Phase47AssetType;
  category: string;
  tags: string[];
  creator: string;
  license: Phase47License;
  status: Phase47AssetStatus;
  premium: boolean;
  featured: boolean;
  downloads: number;
  rating: number;
  width?: number;
  height?: number;
  durationSeconds?: number;
  format: string;
  previewColor: string;
  sourceUri?: string;
};

export type Phase47Collection = { id: string; name: string; assetIds: string[]; createdAt: string };
export type Phase47CreatorSubmission = { id: string; creator: string; title: string; type: Phase47AssetType; submittedAt: string; status: Phase47AssetStatus; notes?: string };
export type Phase47SearchOptions = { query?: string; type?: Phase47AssetType | "all"; license?: Phase47License | "all"; premium?: boolean; featured?: boolean; sort?: "relevance" | "popular" | "rating" | "newest" };

const TYPES: Phase47AssetType[] = ["icon","illustration","photo","video","audio","font","frame","background","sticker","mockup"];
const COLORS = ["#0f172a","#0f766e","#7c3aed","#be123c","#1d4ed8","#c2410c","#4338ca","#047857","#a21caf","#334155"];
const TITLES: Record<Phase47AssetType, string[]> = {
  icon:["Business Line Icons","Social Media Icons","Commerce Symbols","Navigation Essentials"],
  illustration:["Modern Team Illustration","Creative Workspace Scene","Abstract Growth Story","Customer Support Scene"],
  photo:["Premium Office Interior","Product Flat Lay","Urban Architecture","Natural Lifestyle"],
  video:["Elegant Logo Reveal","Modern Product Promo","Social Story Motion","Corporate Opener"],
  audio:["Warm Corporate Theme","Upbeat Social Intro","Ambient Focus Bed","Clean Notification Pack"],
  font:["Editorial Display Family","Modern Sans Collection","Friendly Rounded Typeface","Professional Serif Set"],
  frame:["Organic Photo Frames","Editorial Crop Frames","Device Screen Frames","Geometric Mask Set"],
  background:["Mesh Gradient Pack","Paper Texture Collection","Abstract Geometry Set","Soft Studio Backdrops"],
  sticker:["Productivity Sticker Set","Marketing Badge Pack","Hand Drawn Arrows","Celebration Labels"],
  mockup:["Premium Hoodie Mockup","Magazine Cover Mockup","Mobile App Showcase","Packaging Box Scene"],
};

export const PHASE47_ASSET_TYPES = TYPES;
export const PHASE47_CAPABILITIES = [
  "Unified searchable catalog for icons, illustrations, photos, video, audio, fonts, frames, backgrounds, stickers, and mockups",
  "Free, Pro, Enterprise, and creator licensing metadata",
  "Favorites and reusable user collections",
  "Creator submission and moderation workflow foundation",
  "Featured, popular, rating, and newest sorting",
  "Format, dimension, duration, creator, and usage metadata",
  "Marketplace-ready filtering without claiming external stock-provider deployment",
];

export const PHASE47_ASSETS: Phase47Asset[] = TYPES.flatMap((type, typeIndex) => TITLES[type].map((title, index) => ({
  id:`p47-${type}-${index+1}`,
  title,
  type,
  category:type === "icon" ? "Interface" : type === "photo" ? "Photography" : type === "audio" ? "Music & Sound" : "Creative Assets",
  tags:[type,"professional",index % 2 ? "modern" : "premium", title.split(" ")[0].toLowerCase()],
  creator:index % 3 === 0 ? "Yaposan Studio" : index % 3 === 1 ? "Northstar Creative" : "Independent Creator",
  license:index === 0 ? "free" : index === 3 ? "enterprise" : index === 2 ? "creator" : "pro",
  status:"published",
  premium:index !== 0,
  featured:index === 0 || (typeIndex + index) % 5 === 0,
  downloads:1250 + typeIndex * 487 + index * 933,
  rating:Number((4.2 + ((typeIndex + index) % 8) / 10).toFixed(1)),
  width:["photo","background","mockup","illustration","frame","sticker","icon"].includes(type) ? 2400 : undefined,
  height:["photo","background","mockup","illustration","frame","sticker","icon"].includes(type) ? 1600 : undefined,
  durationSeconds:type === "video" ? 12 + index * 8 : type === "audio" ? 18 + index * 22 : undefined,
  format:type === "icon" || type === "illustration" || type === "frame" || type === "sticker" ? "SVG" : type === "photo" || type === "background" || type === "mockup" ? "PNG/JPG" : type === "video" ? "MP4" : type === "audio" ? "MP3/WAV" : "OTF/TTF",
  previewColor:COLORS[typeIndex],
})));

export function searchPhase47Assets(assets: Phase47Asset[], options: Phase47SearchOptions = {}) {
  const query = (options.query ?? "").trim().toLowerCase();
  let result = assets.filter((asset) => {
    if (options.type && options.type !== "all" && asset.type !== options.type) return false;
    if (options.license && options.license !== "all" && asset.license !== options.license) return false;
    if (options.premium !== undefined && asset.premium !== options.premium) return false;
    if (options.featured !== undefined && asset.featured !== options.featured) return false;
    if (!query) return true;
    return [asset.title, asset.type, asset.category, asset.creator, ...asset.tags].some((value) => value.toLowerCase().includes(query));
  });
  if (options.sort === "popular") result = [...result].sort((a,b) => b.downloads - a.downloads);
  if (options.sort === "rating") result = [...result].sort((a,b) => b.rating - a.rating);
  if (options.sort === "newest") result = [...result].reverse();
  return result;
}

export function togglePhase47Favorite(favorites: string[], assetId: string) {
  return favorites.includes(assetId) ? favorites.filter((id) => id !== assetId) : [...favorites, assetId];
}

export function addPhase47AssetToCollection(collection: Phase47Collection, assetId: string): Phase47Collection {
  return collection.assetIds.includes(assetId) ? collection : { ...collection, assetIds:[...collection.assetIds, assetId] };
}

export function submitPhase47CreatorAsset(input: Omit<Phase47CreatorSubmission,"id"|"submittedAt"|"status">): Phase47CreatorSubmission {
  return { ...input, id:`phase47-submission-${Date.now()}`, submittedAt:new Date().toISOString(), status:"review" };
}

export function phase47CatalogStats(assets: Phase47Asset[]) {
  return {
    total:assets.length,
    free:assets.filter((asset) => asset.license === "free").length,
    premium:assets.filter((asset) => asset.premium).length,
    featured:assets.filter((asset) => asset.featured).length,
    creators:new Set(assets.map((asset) => asset.creator)).size,
    types:new Set(assets.map((asset) => asset.type)).size,
  };
}
