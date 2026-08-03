import AsyncStorage from "@react-native-async-storage/async-storage";
import type { TemplateUsageRecord } from "./types";
const KEYS = { favorites: "yaposan:24.2a0:template-favorites", usage: "yaposan:24.2a0:template-usage" };
async function load<T>(key: string, fallback: T): Promise<T> { try { const raw = await AsyncStorage.getItem(key); return raw ? JSON.parse(raw) as T : fallback; } catch { return fallback; } }
export const templateStorage = {
  loadFavorites: () => load<string[]>(KEYS.favorites, []),
  saveFavorites: (ids: string[]) => AsyncStorage.setItem(KEYS.favorites, JSON.stringify([...new Set(ids)])),
  loadUsage: () => load<TemplateUsageRecord[]>(KEYS.usage, []),
  saveUsage: (records: TemplateUsageRecord[]) => AsyncStorage.setItem(KEYS.usage, JSON.stringify(records)),
  async recordOpen(templateId: string): Promise<TemplateUsageRecord[]> {
    const records = await this.loadUsage(); const now = new Date().toISOString(); const current = records.find(item => item.templateId === templateId);
    const next = current ? records.map(item => item.templateId === templateId ? { ...item, lastOpenedAt: now, openCount: item.openCount + 1 } : item) : [{ templateId, lastOpenedAt: now, openCount: 1 }, ...records];
    await this.saveUsage(next); return next;
  },
};
