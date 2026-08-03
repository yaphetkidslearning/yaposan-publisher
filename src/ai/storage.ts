import AsyncStorage from "@react-native-async-storage/async-storage";
import { DEFAULT_AI_SETTINGS, type AISettings, type AIGenerationResult } from "./providerManager";

const SETTINGS_KEY = "yaposan:phase241g:ai-settings";
const USAGE_KEY = "yaposan:phase241g:ai-usage";

export type AIUsageEntry = Pick<AIGenerationResult, "provider"|"model"|"inputTokens"|"outputTokens"|"durationMs"|"createdAt"> & { capability: string };

export async function loadAISettings(): Promise<AISettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) return DEFAULT_AI_SETTINGS;
  try { return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) }; } catch { return DEFAULT_AI_SETTINGS; }
}
export async function saveAISettings(settings: AISettings) { await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
export async function resetAISettings() { await AsyncStorage.removeItem(SETTINGS_KEY); }
export async function loadAIUsage(): Promise<AIUsageEntry[]> {
  const raw = await AsyncStorage.getItem(USAGE_KEY);
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}
export async function addAIUsage(entry: AIUsageEntry) {
  const current = await loadAIUsage();
  await AsyncStorage.setItem(USAGE_KEY, JSON.stringify([entry, ...current].slice(0, 250)));
}
