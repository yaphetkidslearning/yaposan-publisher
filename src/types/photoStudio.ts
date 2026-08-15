export type PhotoStudioAsset = {
  id: string;
  uri: string;
  originalUri?: string;
  cutoutUri?: string;
  backgroundMode?: "original" | "transparent" | "white" | "color";
  backgroundColor?: string;
  name: string;
  createdAt: number;
  rotation: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type PhotoStudioProject = {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  activeAssetId?: string;
  assets: PhotoStudioAsset[];
  beforeAfter: number;
  zoom: number;
  panX: number;
  panY: number;
};

export type PhotoStudioSnapshot = PhotoStudioProject;
