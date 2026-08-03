import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MarketplaceTemplateRecord, TemplateReview } from "./templateMarketplace";
import type { TemplateManagerState } from "./templateManager";

const RECORDS_KEY = "yaposan.phase242a4.marketplace.records";
const REVIEWS_KEY = "yaposan.phase242a4.marketplace.reviews";
const MANAGER_KEY = "yaposan.phase242a4.template.manager";

const read = async <T>(key: string, fallback: T): Promise<T> => {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const loadMarketplaceRecords = (): Promise<MarketplaceTemplateRecord[]> => read(RECORDS_KEY, []);
export const saveMarketplaceRecords = (records: MarketplaceTemplateRecord[]): Promise<void> =>
  AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
export const loadTemplateReviews = (): Promise<TemplateReview[]> => read(REVIEWS_KEY, []);
export const saveTemplateReviews = (reviews: TemplateReview[]): Promise<void> =>
  AsyncStorage.setItem(REVIEWS_KEY, JSON.stringify(reviews));
export const loadTemplateManagerState = (fallback: TemplateManagerState): Promise<TemplateManagerState> =>
  read(MANAGER_KEY, fallback);
export const saveTemplateManagerState = (state: TemplateManagerState): Promise<void> =>
  AsyncStorage.setItem(MANAGER_KEY, JSON.stringify(state));
