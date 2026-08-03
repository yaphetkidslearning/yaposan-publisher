import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PhotoStudioProject } from "../types/photoStudio";

const STORAGE_KEY = "yaposan.photo-studio.phase17.15.project";
export async function savePhotoStudioProject(project: PhotoStudioProject) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...project, updatedAt: Date.now() }));
}
export async function loadPhotoStudioProject(): Promise<PhotoStudioProject | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as PhotoStudioProject; } catch { return null; }
}
export async function clearPhotoStudioProject() { await AsyncStorage.removeItem(STORAGE_KEY); }
