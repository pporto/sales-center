"use strict";

importScripts(
  "shared/constants.js",
  "shared/types.js",
  "shared/errors.js",
  "shared/utils.js",
  "infra/chromeStorageAdapter.js",
  "background/cache/cacheManager.js",
  "background/cache/requestDeduplicator.js",
  "background/requestRecorder.js",
  "background/httpUtils.js",
  "background/salesCloudSession.js",
  "background/smcHttpTransport.js",
  "background/smcApiClient.js",
  "background/salesCenterRepository.js",
  "background/messageRouter.js",
);

const salesCenterStorageAdapter = SalesCenterInfra.createChromeStorageAdapter("local");
const salesCenterCacheManager = SalesCenterBackgroundCache.createCacheManager({
  maxEntries: SalesCenterConstants.REQUEST_CACHE_MAX_ENTRIES,
  namespace: SalesCenterConstants.CACHE_NAMESPACE,
  storageAdapter: salesCenterStorageAdapter,
  storageKey: SalesCenterConstants.REQUEST_CACHE_STORAGE_KEY,
});
const salesCenterRequestDeduplicator = SalesCenterBackgroundCache.createRequestDeduplicator();
let salesCenterRepository = null;

function getSalesCenterRepository() {
  if (!salesCenterRepository) {
    const apiClient = SalesCenterBackground.createSmcApiClient({
      fetchJson: SalesCenterBackgroundRuntime.fetchJson,
      publishProgress: SalesCenterBackgroundRuntime.publishProgress,
    });

    salesCenterRepository = SalesCenterBackground.createSalesCenterRepository({
      apiClient,
      cacheManager: salesCenterCacheManager,
      closeTemporarySalesCloudTab: SalesCenterBackgroundRuntime.closeTemporarySalesCloudTab,
      createDebugState: SalesCenterBackgroundRuntime.createDebugState,
      deduplicator: salesCenterRequestDeduplicator,
      ensureSalesCloudExecutionContext: SalesCenterBackgroundRuntime.ensureSalesCloudExecutionContext,
      publishProgress: SalesCenterBackgroundRuntime.publishProgress,
    });
  }

  return salesCenterRepository;
}

async function handleFetchDashboardMessage(message, sender) {
  const payload = message?.payload || message || {};
  const meta = message?.meta || {};

  return getSalesCenterRepository().getDashboard({
    forceRefresh: payload.forceRefresh === true,
    frameName: meta.frameName || payload.frameName,
    period: SalesCenterUtils.normalizePeriod(payload.period),
    progressRequestId: meta.requestId || payload.progressRequestId || null,
    tabId: sender.tab?.id,
    territoryIds: SalesCenterUtils.normalizeTerritoryIds(payload.territoryIds),
  });
}

const salesCenterMessageRouter = SalesCenterBackground.createMessageRouter({
  handlers: {
    "salesCenter.fetchCurrentQuarter": handleFetchDashboardMessage,
    "salesCenter.fetchDashboard": handleFetchDashboardMessage,
  },
  normalizeError: SalesCenterErrors.toMessageError,
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  return salesCenterMessageRouter.handle(message, sender, sendResponse);
});
