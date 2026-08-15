import type { PhotoStudioAsset, PhotoStudioProject } from "../types/photoStudio";

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function createPhotoStudioProject(name = "Untitled Photo Project"): PhotoStudioProject {
  const now = Date.now();
  return { id: uid("photo-project"), name, createdAt: now, updatedAt: now, assets: [], beforeAfter: 100, zoom: 1, panX: 0, panY: 0 };
}

export function createPhotoAsset(uri: string, name = "Imported image"): PhotoStudioAsset {
  return { id: uid("asset"), uri, originalUri: uri, backgroundMode: "original", name, createdAt: Date.now(), rotation: 0, scale: 1, offsetX: 0, offsetY: 0 };
}

export function addPhotoAssets(project: PhotoStudioProject, assets: PhotoStudioAsset[]): PhotoStudioProject {
  const nextAssets = [...project.assets, ...assets];
  return { ...project, assets: nextAssets, activeAssetId: project.activeAssetId ?? nextAssets[0]?.id, updatedAt: Date.now() };
}

export function reorderPhotoAsset(project: PhotoStudioProject, assetId: string, direction: -1 | 1): PhotoStudioProject {
  const index = project.assets.findIndex((asset) => asset.id === assetId);
  if (index < 0) return project;
  const target = index + direction;
  if (target < 0 || target >= project.assets.length) return project;
  const assets = [...project.assets];
  [assets[index], assets[target]] = [assets[target], assets[index]];
  return { ...project, assets, updatedAt: Date.now() };
}

export function updateActivePhotoAsset(project: PhotoStudioProject, patch: Partial<PhotoStudioAsset>): PhotoStudioProject {
  if (!project.activeAssetId) return project;
  return { ...project, updatedAt: Date.now(), assets: project.assets.map((asset) => asset.id === project.activeAssetId ? { ...asset, ...patch } : asset) };
}

export function removePhotoAsset(project: PhotoStudioProject, assetId: string): PhotoStudioProject {
  const assets = project.assets.filter((asset) => asset.id !== assetId);
  const activeAssetId = project.activeAssetId === assetId ? assets[0]?.id : project.activeAssetId;
  return { ...project, assets, activeAssetId, updatedAt: Date.now() };
}

