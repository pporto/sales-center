"use strict";

function createSalesCenterRepository({
  apiClient,
  cacheManager,
  closeTemporarySalesCloudTab,
  createDebugState,
  deduplicator,
  ensureSalesCloudExecutionContext,
  publishProgress,
}) {
  const constants = globalThis.SalesCenterConstants;
  const utils = globalThis.SalesCenterUtils;

  async function getDashboard(sessionContext) {
    const requestContext = createRequestContext(sessionContext);
    const cacheKey = cacheManager.createKey(
      apiClient.createDashboardCacheKey({
        period: requestContext.period,
        territoryIds: requestContext.selectedTerritoryIds,
      }),
    );

    if (requestContext.forceRefresh) {
      publishProgress(requestContext, {
        label: "Invalidando cache",
        progress: 4,
        stage: "cacheInvalidation",
      });
      await cacheManager.invalidateAll();
      deduplicator.clear();
    } else {
      const cachedEntry = await cacheManager.get(cacheKey);
      if (cachedEntry) {
        publishProgress(requestContext, {
          cachedAt: cachedEntry.cachedAt,
          expiresAt: cachedEntry.expiresAt,
          label: "Usando cache de oportunidades",
          progress: 96,
          stage: "cache",
        });
        return createCachedDashboardData(cachedEntry, requestContext, cacheKey);
      }
    }

    const generation = cacheManager.getGeneration();
    return deduplicator.run(cacheKey, () =>
      loadDashboardFromSource(requestContext, cacheKey, generation),
    );
  }

  function createRequestContext(sessionContext) {
    const period = utils.normalizePeriod(sessionContext.period);

    return {
      debug: createDebugState(sessionContext),
      executionFrameId: null,
      executionSource: null,
      executionTabId: null,
      forceRefresh: sessionContext.forceRefresh === true,
      frameId: null,
      period,
      progressValue: 0,
      progressRequestId: sessionContext.progressRequestId || null,
      renewalForecast: period === constants.PERIODS.RENEWALS,
      selectedTerritoryIds: utils.normalizeTerritoryIds(sessionContext.territoryIds),
      tabId: sessionContext.tabId,
      temporarySalesCloudTabId: null,
    };
  }

  async function loadDashboardFromSource(requestContext, cacheKey, generation) {
    try {
      publishProgress(requestContext, {
        label: "Preparando sessao",
        progress: 6,
        stage: "session",
      });
      await ensureSalesCloudExecutionContext(requestContext);

      const data = await apiClient.fetchDashboardData(requestContext);

      if (generation === cacheManager.getGeneration()) {
        await cacheManager.set(cacheKey, createCacheableDashboardData(data), constants.CACHE_TTL_MS.dashboard);

        const resolvedCacheKey = cacheManager.createKey(
          apiClient.createDashboardCacheKey({
            period: requestContext.period,
            territoryIds: data.selectedTerritoryIds,
          }),
        );
        if (resolvedCacheKey !== cacheKey) {
          await cacheManager.set(
            resolvedCacheKey,
            createCacheableDashboardData(data),
            constants.CACHE_TTL_MS.dashboard,
          );
        }
      }

      return data;
    } finally {
      await closeTemporarySalesCloudTab(requestContext);
    }
  }

  function createCacheableDashboardData(data) {
    const {
      debug,
      ...cacheableData
    } = data || {};

    return cacheableData;
  }

  function createCachedDashboardData(cacheEntry, requestContext, cacheKey) {
    return {
      ...cacheEntry.data,
      cache: {
        cachedAt: cacheEntry.cachedAt,
        expiresAt: cacheEntry.expiresAt,
        hit: true,
        key: cacheKey,
        status: "hit",
      },
      debug: createCachedDebugState(requestContext, cacheEntry, cacheKey),
    };
  }

  function createCachedDebugState(requestContext, cacheEntry, cacheKey) {
    return {
      ...createDebugState({
        frameName: requestContext.debug?.frameName,
        period: requestContext.period,
      }),
      cache: {
        cachedAt: cacheEntry.cachedAt,
        expiresAt: cacheEntry.expiresAt,
        hit: true,
        key: cacheKey,
        status: "hit",
      },
    };
  }

  return {
    getDashboard,
  };
}

globalThis.SalesCenterBackground = {
  ...(globalThis.SalesCenterBackground || {}),
  createSalesCenterRepository,
};
