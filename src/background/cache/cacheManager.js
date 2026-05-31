"use strict";

function createCacheManager({
  maxEntries,
  namespace,
  now = () => Date.now(),
  storageAdapter,
  storageKey,
}) {
  const memory = new Map();
  let generation = 0;

  function createKey(parts) {
    return [
      namespace,
      ...parts.map((part) => encodeURIComponent(String(part))),
    ].join(":");
  }

  function getExpiresAtMs(entry) {
    if (Number.isFinite(entry?.expiresAtMs)) {
      return entry.expiresAtMs;
    }

    const parsedExpiresAt = Date.parse(entry?.expiresAt || "");
    return Number.isFinite(parsedExpiresAt) ? parsedExpiresAt : 0;
  }

  function isFresh(entry) {
    return Boolean(entry?.data) && getExpiresAtMs(entry) > now();
  }

  async function readStore() {
    const store = await storageAdapter.get(storageKey);

    if (!store || typeof store !== "object") {
      return { entries: {}, version: 1 };
    }

    return {
      entries: store.entries && typeof store.entries === "object" ? store.entries : {},
      version: 1,
    };
  }

  async function writeStore(store) {
    await storageAdapter.set(storageKey, {
      entries: store.entries || {},
      version: 1,
    });
  }

  function prune(entries) {
    const freshEntries = Object.entries(entries || {})
      .filter(([, entry]) => isFresh(entry))
      .sort((entryA, entryB) =>
        Date.parse(entryB[1].cachedAt || "") - Date.parse(entryA[1].cachedAt || ""),
      )
      .slice(0, maxEntries);

    return Object.fromEntries(freshEntries);
  }

  return {
    createKey,

    getGeneration() {
      return generation;
    },

    async get(key) {
      const memoryEntry = memory.get(key);
      if (isFresh(memoryEntry)) {
        return memoryEntry;
      }

      if (memoryEntry) {
        memory.delete(key);
      }

      const store = await readStore();
      const storageEntry = store.entries[key] || null;
      if (isFresh(storageEntry)) {
        memory.set(key, storageEntry);
        return storageEntry;
      }

      if (storageEntry) {
        delete store.entries[key];
        await writeStore(store);
      }

      return null;
    },

    async invalidateAll() {
      generation += 1;
      memory.clear();
      await writeStore({ entries: {}, version: 1 });
    },

    async set(key, data, ttlMs) {
      const createdAt = now();
      const entry = {
        cachedAt: new Date(createdAt).toISOString(),
        data,
        expiresAt: new Date(createdAt + ttlMs).toISOString(),
        expiresAtMs: createdAt + ttlMs,
      };

      memory.set(key, entry);

      const store = await readStore();
      store.entries[key] = entry;
      store.entries = prune(store.entries);
      await writeStore(store);
      return entry;
    },
  };
}

globalThis.SalesCenterBackgroundCache = {
  ...(globalThis.SalesCenterBackgroundCache || {}),
  createCacheManager,
};
