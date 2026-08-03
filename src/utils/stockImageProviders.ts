export type StockImage = { id: string; provider: string; previewUri: string; downloadUri: string; width: number; height: number; author?: string; attributionUrl?: string };
export type StockSearchOptions = { query: string; page?: number; perPage?: number; orientation?: "landscape" | "portrait" | "square" };
export interface StockImageProvider { id: string; search(options: StockSearchOptions): Promise<StockImage[]>; }

export class StockProviderRegistry {
  private providers = new Map<string, StockImageProvider>();
  register(provider: StockImageProvider) { this.providers.set(provider.id, provider); }
  get(id: string) { return this.providers.get(id); }
  list() { return [...this.providers.values()]; }
  async searchAll(options: StockSearchOptions) {
    const results = await Promise.allSettled(this.list().map((provider) => provider.search(options)));
    return results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
  }
}
