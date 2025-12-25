import localforage from 'localforage';

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
const METADATA_KEY = '__cache_metadata__';

class CacheService {
  constructor(options = {}) {
    this.ttl = options.ttl || DEFAULT_TTL;
    this.maxSize = options.maxSize || MAX_CACHE_SIZE;
    this.storeName = options.storeName || 'llm_chat_cache';

    this.store = localforage.createInstance({
      name: 'llm_chat',
      storeName: this.storeName,
    });

    this.metadataStore = localforage.createInstance({
      name: 'llm_chat',
      storeName: 'cache_metadata',
    });
  }

  async get(key) {
    try {
      const metadata = await this.getMetadata(key);

      if (!metadata) {
        return null;
      }

      if (this.isExpired(metadata)) {
        await this.delete(key);
        return null;
      }

      return await this.store.getItem(key);
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  async set(key, value, ttl = this.ttl) {
    try {
      const serialized = JSON.stringify(value);
      const size = new Blob([serialized]).size;

      await this.ensureSpace(size);

      await this.store.setItem(key, value);
      await this.setMetadata(key, {
        key,
        size,
        createdAt: Date.now(),
        expiresAt: Date.now() + ttl,
      });

      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  async delete(key) {
    try {
      await this.store.removeItem(key);
      await this.deleteMetadata(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  async clear() {
    try {
      await this.store.clear();
      await this.metadataStore.clear();
      return true;
    } catch (error) {
      console.error('Cache clear error:', error);
      return false;
    }
  }

  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }

  async getMetadata(key) {
    try {
      return await this.metadataStore.getItem(key);
    } catch {
      return null;
    }
  }

  async setMetadata(key, metadata) {
    await this.metadataStore.setItem(key, metadata);
  }

  async deleteMetadata(key) {
    await this.metadataStore.removeItem(key);
  }

  async getAllMetadata() {
    const metadata = [];
    await this.metadataStore.iterate((value, key) => {
      if (key !== METADATA_KEY) {
        metadata.push(value);
      }
    });
    return metadata;
  }

  isExpired(metadata) {
    return metadata.expiresAt < Date.now();
  }

  async getCacheSize() {
    const allMetadata = await this.getAllMetadata();
    return allMetadata.reduce((total, meta) => total + (meta.size || 0), 0);
  }

  async ensureSpace(neededSize) {
    const currentSize = await this.getCacheSize();

    if (currentSize + neededSize <= this.maxSize) {
      return;
    }

    const allMetadata = await this.getAllMetadata();
    const sorted = allMetadata.sort((a, b) => a.createdAt - b.createdAt);

    let freedSize = 0;
    for (const meta of sorted) {
      if (currentSize - freedSize + neededSize <= this.maxSize) {
        break;
      }
      await this.delete(meta.key);
      freedSize += meta.size || 0;
    }
  }

  async cleanExpired() {
    const allMetadata = await this.getAllMetadata();
    const now = Date.now();

    for (const meta of allMetadata) {
      if (meta.expiresAt < now) {
        await this.delete(meta.key);
      }
    }
  }

  async getStats() {
    const allMetadata = await this.getAllMetadata();
    const size = allMetadata.reduce((total, meta) => total + (meta.size || 0), 0);

    return {
      itemCount: allMetadata.length,
      totalSize: size,
      maxSize: this.maxSize,
      usagePercent: Math.round((size / this.maxSize) * 100),
    };
  }
}

export const cacheService = new CacheService();
export { CacheService };