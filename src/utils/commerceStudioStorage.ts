import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CommerceStudioState } from "../types/commerceStudio";
import { createCommerceState, normalizeCommerceState } from "./commerceStudioEngine";

const KEY = "yaposan:commerce-studio:phase17.19";
const LEGACY_KEY = "yaposan:commerce-studio:phase17.17";
export async function loadCommerceState(): Promise<CommerceStudioState> {
  try {
    const raw = await AsyncStorage.getItem(KEY) ?? await AsyncStorage.getItem(LEGACY_KEY);
    return raw ? normalizeCommerceState(JSON.parse(raw)) : createCommerceState();
  } catch { return createCommerceState(); }
}
export async function saveCommerceState(state: CommerceStudioState): Promise<void> { await AsyncStorage.setItem(KEY, JSON.stringify(normalizeCommerceState(state))); }
