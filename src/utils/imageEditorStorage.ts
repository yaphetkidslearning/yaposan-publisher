import AsyncStorage from "@react-native-async-storage/async-storage";
import type { ImageEditorState } from "../types/imageEditor";
const KEY = "yaposan.phase17.18.image-editor";
export async function saveImageEditorState(state: ImageEditorState) { await AsyncStorage.setItem(KEY, JSON.stringify(state)); }
export async function loadImageEditorState(): Promise<ImageEditorState | undefined> { const raw = await AsyncStorage.getItem(KEY); if (!raw) return undefined; try { return JSON.parse(raw) as ImageEditorState; } catch { return undefined; } }
