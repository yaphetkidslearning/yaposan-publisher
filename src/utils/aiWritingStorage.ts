import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AiPresetPrompt, AiPromptRecord } from "../types/aiWriting";
const HISTORY_KEY = "yaposan.ai.history.v1";
const PROMPTS_KEY = "yaposan.ai.prompts.v1";
export async function loadAiHistory(): Promise<AiPromptRecord[]> { try { const raw=await AsyncStorage.getItem(HISTORY_KEY); return raw ? JSON.parse(raw) as AiPromptRecord[] : []; } catch { return []; } }
export async function saveAiHistory(history: AiPromptRecord[]) { await AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0,100))); }
export async function loadSavedPrompts(): Promise<AiPresetPrompt[]> { try { const raw=await AsyncStorage.getItem(PROMPTS_KEY); return raw ? JSON.parse(raw) as AiPresetPrompt[] : []; } catch { return []; } }
export async function saveSavedPrompts(prompts: AiPresetPrompt[]) { await AsyncStorage.setItem(PROMPTS_KEY, JSON.stringify(prompts.slice(0,100))); }
