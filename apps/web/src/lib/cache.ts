
type CacheItem<T> = {
  data: T;
  expiry: number;
};

class ApiCache {
  private cache = new Map<string, CacheItem<any>>();

  async wrap<T>(key: string, ttlSeconds: number, fetcher: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const cached = this.cache.get(key);

    if (cached && cached.expiry > now) {
      return cached.data;
    }

    const data = await fetcher();
    this.cache.set(key, { data, expiry: now + ttlSeconds * 1000 });
    return data;
  }
}

export const apiCache = new ApiCache();
