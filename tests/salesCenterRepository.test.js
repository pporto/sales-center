"use strict";

const assert = require("node:assert/strict");

require("../src/shared/constants.js");
require("../src/shared/errors.js");
require("../src/shared/utils.js");
require("../src/background/cache/cacheManager.js");
require("../src/background/cache/requestDeduplicator.js");
require("../src/background/salesCenterRepository.js");

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
    maxEntries: 20,
    namespace: SalesCenterConstants.CACHE_NAMESPACE,
    storageAdapter,
    storageKey: "cache",
  });
  const deduplicator = SalesCenterBackgroundCache.createRequestDeduplicator();
  let apiCalls = 0;
  const apiClient = {
    createDashboardCacheKey({ period, territoryIds }) {
      return ["dashboard", period, territoryIds.join(",") || "default"];
    },
    async fetchDashboardData(requestContext) {
      apiCalls += 1;
      return {
        debug: requestContext.debug,
        forecast: { id: 1 },
        forecastActiveOptions: [],
        generatedAt: "2026-05-31T00:00:00.000Z",
        items: [{ id: apiCalls }],
        pageCount: 1,
        period: requestContext.period,
        selectedTerritoryIds: requestContext.selectedTerritoryIds,
      };
    },
  };
  const repository = SalesCenterBackground.createSalesCenterRepository({
    apiClient,
    cacheManager,
    closeTemporarySalesCloudTab: async () => {},
    createDebugState: () => ({ requests: [], revenueExtraction: [], sessionRecovery: [] }),
    deduplicator,
    ensureSalesCloudExecutionContext: async () => {},
    publishProgress: () => {},
  });

  const query = {
    period: SalesCenterConstants.PERIODS.CURRENT_QUARTER,
    progressRequestId: "test",
    territoryIds: ["10"],
  };
  const first = await repository.getDashboard(query);
  const second = await repository.getDashboard(query);
  const third = await repository.getDashboard({ ...query, forceRefresh: true });

  assert.equal(first.items[0].id, 1);
  assert.equal(second.items[0].id, 1);
  assert.equal(second.cache.status, "hit");
  assert.equal(third.items[0].id, 2);
  assert.equal(apiCalls, 2);

  console.log("salesCenterRepository.test.js passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
