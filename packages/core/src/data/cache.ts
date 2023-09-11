import { Cache as ThreeCache } from 'three';
import { logWarn } from '../utils';

export const Cache = {
    enabled: true,

    maxItems: 10,

    ttl: 10 * 60,

    items: {} as Record<string, { files: Record<string, HTMLImageElement | Blob>; lastAccess: number }>,

    purgeInterval: null as ReturnType<typeof setInterval>,

    init() {
        if (ThreeCache.enabled) {
            logWarn('ThreeJS cache should be disabled');
            ThreeCache.enabled = false;
        }

        if (!this.purgeInterval && this.enabled) {
            this.purgeInterval = setInterval(() => this.purge(), 60 * 1000);
        }
    },

    add(url: string, key: string, data: HTMLImageElement | Blob) {
        if (this.enabled && key) {
            this.items[key] = this.items[key] ?? { files: {}, lastAccess: null };
            this.items[key].files[url] = data;
            this.items[key].lastAccess = Date.now();
        }
    },

    get(url: string, key: string): HTMLImageElement | Blob {
        if (this.enabled && key && this.items[key]) {
            this.items[key].lastAccess = Date.now();
            return this.items[key].files[url];
        }
    },

    remove(url: string, key: string) {
        if (this.enabled && key && this.items[key]) {
            delete this.items[key].files[url];
            if (Object.keys(this.items[key].files).length === 0) {
                delete this.items[key];
            }
        }
    },

    purge() {
        Object.entries(this.items)
            .sort(([, a], [, b]) => {
                return b.lastAccess - a.lastAccess;
            })
            .forEach(([key, { lastAccess }], index) => {
                // remove expired items and extra numerous items
                // but always keep the most recent one
                if (index > 0 && (Date.now() - lastAccess >= this.ttl * 1000 || index >= this.maxItems)) {
                    delete this.items[key];
                }
            });
    },
};
