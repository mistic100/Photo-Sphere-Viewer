type LocalCacheItem<T> = {
    value: T;
    date: number;
};

export const LocalCache = {
  set<T>(key: string, value: T) {
    const item = {
      value,
      date: Date.now(),
    } satisfies LocalCacheItem<T>;
    localStorage.setItem(key, JSON.stringify(item));
  },

  get<T>(key: string, ttlMs: number): T | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;

    try {
      const item = JSON.parse(raw) as LocalCacheItem<T>;
      
      // Check if item structure matches cached TTL payload
      if (item && item.value && typeof item.date === 'number') {
        if (Date.now() - item.date > ttlMs) {
          localStorage.removeItem(key);
          return null;
        }
        return item.value;
      }
      
      return null;
    } catch {
      return null;
    }
  },

  async getOrFetch<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T | null> {
    const current = this.get<T>(key, ttlMs);
    if (current) {
        return current;
    }

    try {
        const fresh = await fn();
        if (fresh) {
            this.set(key, fresh);
        }
        return fresh;
    } catch {
        return null;
    }
  },
};
