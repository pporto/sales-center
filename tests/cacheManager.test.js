"use strict";

const assert = require("node:assert/strict");

globalThis.SalesCenterConstants = {
  CACHE_NAMESPACE: "salesCenter:v1",
};
require("../src/background/cache/cacheManager.js");

let currentTime = 1_000;
const store = {};
const storageAdapter = {
  async get(key) {
    return store[key];
  },
  async set(key, value) {
    store[key] = value;
  },
};

(async () => {
  const cacheManager = SalesCenterBackgroundCache.createCacheManager({
    maxEntries: 2,
    namespace: "salesCenter:v1",
    now: () => currentTime,
    storageAdapter,
    storageKey: "cache",
  });
  const key = cacheManager.createKey(["dashboard", "period"]);

  assert.equal(await cacheManager.get(key), null);

  await cacheManager.set(key, { items: [1] }, 100);
  assert.deepEqual((await cacheManager.get(key)).data, { items: [1] });

  currentTime += 101;
  assert.equal(await cacheManager.get(key), null);

  await cacheManager.set(key, { items: [2] }, 100);
  await cacheManager.invalidateAll();
  assert.equal(await cacheManager.get(key), null);

  console.log("cacheManager.test.js passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
