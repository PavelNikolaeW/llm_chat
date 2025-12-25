// Create the mock stores first
const mockStore = new Map();
const mockMetadataStore = new Map();

jest.mock('localforage', () => ({
  createInstance: jest.fn((config) => {
    const store =
      config.storeName === 'cache_metadata' ? mockMetadataStore : mockStore;

    return {
      getItem: jest.fn((key) => Promise.resolve(store.get(key) || null)),
      setItem: jest.fn((key, value) => {
        store.set(key, value);
        return Promise.resolve(value);
      }),
      removeItem: jest.fn((key) => {
        store.delete(key);
        return Promise.resolve();
      }),
      clear: jest.fn(() => {
        store.clear();
        return Promise.resolve();
      }),
      iterate: jest.fn((callback) => {
        store.forEach((value, key) => callback(value, key));
        return Promise.resolve();
      }),
    };
  }),
}));

// Import after mock is set up
const { CacheService } = require('./cacheService');

describe('CacheService', () => {
  let cacheService;

  beforeEach(() => {
    mockStore.clear();
    mockMetadataStore.clear();
    jest.clearAllMocks();
    cacheService = new CacheService({ storeName: 'test_cache' });
  });

  describe('set and get', () => {
    it('should store and retrieve a value', async () => {
      await cacheService.set('key1', { data: 'test' });
      const result = await cacheService.get('key1');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for non-existent key', async () => {
      const result = await cacheService.get('nonexistent');
      expect(result).toBeNull();
    });

    it('should return null for expired items', async () => {
      await cacheService.set('expired', { data: 'old' }, -1000);
      const result = await cacheService.get('expired');
      expect(result).toBeNull();
    });
  });

  describe('delete', () => {
    it('should delete a stored item', async () => {
      await cacheService.set('toDelete', { data: 'temp' });
      await cacheService.delete('toDelete');
      const result = await cacheService.get('toDelete');
      expect(result).toBeNull();
    });
  });

  describe('clear', () => {
    it('should clear all items', async () => {
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      await cacheService.clear();

      const result1 = await cacheService.get('key1');
      const result2 = await cacheService.get('key2');

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing key', async () => {
      await cacheService.set('exists', 'value');
      const result = await cacheService.has('exists');
      expect(result).toBe(true);
    });

    it('should return false for non-existing key', async () => {
      const result = await cacheService.has('nonexistent');
      expect(result).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      await cacheService.set('key1', { data: 'test1' });
      await cacheService.set('key2', { data: 'test2' });

      const stats = await cacheService.getStats();

      expect(stats.itemCount).toBe(2);
      expect(stats.maxSize).toBe(50 * 1024 * 1024);
      expect(typeof stats.totalSize).toBe('number');
      expect(typeof stats.usagePercent).toBe('number');
    });
  });

  describe('cleanExpired', () => {
    it('should remove expired items', async () => {
      await cacheService.set('valid', 'value', 1000000);
      await cacheService.set('expired', 'value', -1000);

      await cacheService.cleanExpired();

      const validResult = await cacheService.get('valid');
      expect(validResult).toBe('value');
    });
  });

  describe('cache size management', () => {
    it('should evict old items when size limit exceeded', async () => {
      const smallCache = new CacheService({
        maxSize: 100,
        storeName: 'small_cache',
      });

      await smallCache.set('first', 'a'.repeat(50));
      await smallCache.set('second', 'b'.repeat(60));

      const stats = await smallCache.getStats();
      expect(stats.itemCount).toBeLessThanOrEqual(2);
    });
  });

  describe('TTL handling', () => {
    it('should use default TTL when not specified', async () => {
      await cacheService.set('default-ttl', 'value');
      const metadata = await cacheService.getMetadata('default-ttl');

      expect(metadata.expiresAt).toBeGreaterThan(Date.now());
      expect(metadata.expiresAt).toBeLessThanOrEqual(
        Date.now() + 24 * 60 * 60 * 1000 + 1000
      );
    });

    it('should use custom TTL when specified', async () => {
      const customTTL = 1000;
      await cacheService.set('custom-ttl', 'value', customTTL);
      const metadata = await cacheService.getMetadata('custom-ttl');

      expect(metadata.expiresAt).toBeLessThanOrEqual(Date.now() + customTTL + 100);
    });
  });

  describe('error handling', () => {
    it('should handle get errors gracefully', async () => {
      const errorCache = new CacheService({ storeName: 'error_cache' });
      errorCache.store.getItem = jest.fn().mockRejectedValue(new Error('DB error'));

      const result = await errorCache.get('any');
      expect(result).toBeNull();
    });

    it('should handle set errors gracefully', async () => {
      const errorCache = new CacheService({ storeName: 'error_cache' });
      errorCache.store.setItem = jest.fn().mockRejectedValue(new Error('DB error'));

      const result = await errorCache.set('any', 'value');
      expect(result).toBe(false);
    });

    it('should handle delete errors gracefully', async () => {
      const errorCache = new CacheService({ storeName: 'error_cache' });
      errorCache.store.removeItem = jest.fn().mockRejectedValue(new Error('DB error'));

      const result = await errorCache.delete('any');
      expect(result).toBe(false);
    });

    it('should handle clear errors gracefully', async () => {
      const errorCache = new CacheService({ storeName: 'error_cache' });
      errorCache.store.clear = jest.fn().mockRejectedValue(new Error('DB error'));

      const result = await errorCache.clear();
      expect(result).toBe(false);
    });
  });
});
