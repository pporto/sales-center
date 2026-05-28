"use strict";

const API_ORIGIN = "https://gxpap-e.oracle.com";
const API_BASE = `${API_ORIGIN}/oalcrm/web/SalesForecastServices-GEC`;
const SALES_CLOUD_BOOTSTRAP_URL = `${API_ORIGIN}/`;
const SALES_CLOUD_REFERER = `${API_ORIGIN}/oalcrm/web/SalesCloudSMC-GEC/`;
const REQUEST_VERSION_SUFFIX = "-01-30T163200.068Z";
const REVENUE_PAGE_LIMIT = 100;
const MAX_REVENUE_PAGES = 500;
const REVENUE_PROGRESS_START = 32;
const REVENUE_PROGRESS_END = 96;
const PERIOD_CURRENT_QUARTER = "Current Quarter";
const PERIOD_NEXT_QUARTER = "Next Quarter";
const PERIOD_PREVIOUS_QUARTER = "Previous Quarter";
const PERIOD_CURRENT_FISCAL_YEAR = "Current Fiscal Year";
const PERIOD_ROLLING_QUARTERS = "4 Rolling Quarters (CQ + 3)";
const PERIOD_RENEWALS = "RENEWALS (Current + Past Due)";
const SALES_CLOUD_FRAME_REFRESH_AFTER_MS = 12000;
const SALES_CLOUD_FRAME_MAX_REFRESHES = 2;
const SALES_CLOUD_TAB_TIMEOUT_MS = 150000;
const SALES_CLOUD_TAB_REFRESH_AFTER_MS = 10000;
const SALES_CLOUD_TAB_MAX_REFRESHES = 8;
const SALES_CLOUD_TAB_MAX_RECREATES = 2;
const SALES_CLOUD_API_PROBE_AFTER_COMPLETE_MS = 2500;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "salesCenter.fetchCurrentQuarter") {
    return false;
  }

  fetchCurrentQuarter({
    frameName: message.frameName,
    period: normalizePeriod(message.period),
    progressRequestId: message.progressRequestId || null,
    tabId: sender.tab?.id,
    techCloudView: message.techCloudView === true,
    territoryIds: normalizeTerritoryIds(message.territoryIds),
  })
    .then((data) => sendResponse({ data, ok: true }))
    .catch((error) => {
      sendResponse({
        debug: error.debug || null,
        error: {
          code: error.code || null,
          message: error.message,
          name: error.name,
          status: error.status || null,
        },
        ok: false,
      });
    });

  return true;
});

async function fetchCurrentQuarter(sessionContext) {
  const requestContext = {
    debug: createDebugState(sessionContext),
    executionFrameId: null,
    executionSource: null,
    executionTabId: null,
    frameId: null,
    period: normalizePeriod(sessionContext.period),
    progressValue: 0,
    progressRequestId: sessionContext.progressRequestId || null,
    renewalForecast: normalizePeriod(sessionContext.period) === PERIOD_RENEWALS,
    selectedTerritoryIds: normalizeTerritoryIds(sessionContext.territoryIds),
    tabId: sessionContext.tabId,
    temporarySalesCloudTabId: null,
    techCloudView: sessionContext.techCloudView === true,
  };
  try {
    publishProgress(requestContext, {
      label: "Preparando sessao",
      progress: 6,
      stage: "session",
    });
    await ensureSalesCloudExecutionContext(requestContext);

    publishProgress(requestContext, {
      label: "Carregando forecast ativo",
      progress: 14,
      stage: "forecastActive",
    });
    const forecasts = await requestForecastActive(requestContext);

    if (!Array.isArray(forecasts) || forecasts.length === 0) {
      throw new SalesCenterRequestError(
      "Forecast ACTIVE não retornou registros para Current Quarter.",
        404,
        requestContext.debug,
      );
    }

    const revenueForecasts = forecasts.filter(isRevenueForecast);

    if (revenueForecasts.length === 0) {
      throw new SalesCenterRequestError(
        "Forecast ACTIVE nÃ£o retornou registros REVENUE para Current Quarter.",
        404,
        requestContext.debug,
      );
    }

    const forecastActiveOptions = createForecastActiveOptions(revenueForecasts);
    const selectedTerritoryIds = selectTerritoryIds(
      forecastActiveOptions,
      requestContext.selectedTerritoryIds,
    );
    const activeForecast = selectActiveForecast(
      revenueForecasts,
      selectedTerritoryIds,
    );
    requestContext.selectedTerritoryIds = selectedTerritoryIds;
    publishProgress(requestContext, {
      label: "Resolvendo periodo",
      progress: 24,
      stage: "period",
    });
    const forecast = await resolveForecastForPeriod(requestContext, activeForecast);
    publishProgress(requestContext, {
      label: "Carregando oportunidades",
      progress: 32,
      stage: "revenue",
    });
    const revenueResult = await requestRevenueItemsPaginated(
      requestContext,
      forecast,
    );

    return {
      debug: requestContext.debug,
      forecast,
      forecastActiveOptions,
      forecastCount: revenueForecasts.length,
      generatedAt: new Date().toISOString(),
      items: revenueResult.items,
      pageCount: revenueResult.pageCount,
      period: requestContext.period,
      selectedTerritoryIds,
    };
  } finally {
    await closeTemporarySalesCloudTab(requestContext);
  }
}

async function requestForecastActive(requestContext) {
  return fetchJson(requestContext, "requestForecastActive", getForecastActiveUrl(), {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
      "Content-Type": "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
    method: "GET",
  });
}

function isRevenueForecast(forecast) {
  return String(forecast?.forecastType || "").trim().toUpperCase() === "REVENUE";
}

function createForecastActiveOptions(forecasts) {
  const uniqueOptions = [];
  const seenTerritoryIds = new Set();

  for (const forecast of forecasts) {
    const territoryId = normalizeTerritoryId(forecast.territoryId);

    if (!territoryId || seenTerritoryIds.has(territoryId)) {
      continue;
    }

    seenTerritoryIds.add(territoryId);
    uniqueOptions.push({
      forecastHeaderId: forecast.forecastHeaderId ?? null,
      forecastType: forecast.forecastType ?? null,
      territoryId,
      territoryName: forecast.territoryName || "-",
    });
  }

  return uniqueOptions;
}

function selectTerritoryIds(options, requestedTerritoryIds) {
  const availableTerritoryIds = options.map((option) => option.territoryId);
  const availableTerritoryIdSet = new Set(availableTerritoryIds);
  const selectedTerritoryIds = requestedTerritoryIds.filter((territoryId) =>
    availableTerritoryIdSet.has(territoryId),
  );

  return selectedTerritoryIds.length > 0
    ? selectedTerritoryIds
    : availableTerritoryIds.slice(0, 1);
}

function selectActiveForecast(forecasts, selectedTerritoryIds) {
  if (!selectedTerritoryIds.length) {
    return forecasts[0];
  }

  const selectedTerritoryIdSet = new Set(selectedTerritoryIds);
  return forecasts.find((forecast) =>
    selectedTerritoryIdSet.has(normalizeTerritoryId(forecast.territoryId)),
  ) || forecasts[0];
}

function normalizeTerritoryIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(value.map(normalizeTerritoryId).filter(Boolean)),
  );
}

function normalizeTerritoryId(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

async function requestNextQuarter(requestContext, activeForecast) {
  return requestPreviousNextQuarter(
    requestContext,
    activeForecast,
    "NEXT",
    PERIOD_NEXT_QUARTER,
    "requestNextQuarter",
  );
}

async function requestPreviousQuarter(requestContext, activeForecast) {
  return requestPreviousNextQuarter(
    requestContext,
    activeForecast,
    "PREVIOUS",
    PERIOD_PREVIOUS_QUARTER,
    "requestPreviousQuarter",
  );
}

async function resolveForecastForPeriod(requestContext, activeForecast) {
  if (requestContext.period === PERIOD_NEXT_QUARTER) {
    return requestNextQuarter(requestContext, activeForecast);
  }

  if (requestContext.period === PERIOD_PREVIOUS_QUARTER) {
    return requestPreviousQuarter(requestContext, activeForecast);
  }

  if (requestContext.period === PERIOD_CURRENT_FISCAL_YEAR) {
    return requestFullYearForecast(
      requestContext,
      activeForecast,
      PERIOD_CURRENT_FISCAL_YEAR,
      "requestFullYearForecast",
    );
  }

  if (requestContext.period === PERIOD_ROLLING_QUARTERS) {
    return requestFullYearForecast(
      requestContext,
      activeForecast,
      PERIOD_ROLLING_QUARTERS,
      "requestRollingYearForecastHeader",
    );
  }

  return activeForecast;
}

async function requestFullYearForecast(
  requestContext,
  activeForecast,
  periodLabel,
  requestLabel,
) {
  const fullYearForecasts = await fetchJson(
    requestContext,
    requestLabel,
    getYearForecastHeaderUrl(activeForecast, periodLabel),
    {
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      method: "GET",
    },
  );

  if (!Array.isArray(fullYearForecasts) || fullYearForecasts.length === 0) {
    throw new SalesCenterRequestError(
      `Forecast full year nao retornou registros para ${periodLabel}.`,
      404,
      requestContext.debug,
    );
  }

  const forecastHeaders = normalizeFullYearForecastHeaders(
    fullYearForecasts,
    activeForecast,
    periodLabel,
  );

  const incompleteForecast = forecastHeaders.find(
    (forecast) => !forecast.forecastHeaderId || !forecast.startDate || !forecast.endDate,
  );

  if (incompleteForecast) {
    throw new SalesCenterRequestError(
      `Forecast full year retornou header incompleto para ${periodLabel}.`,
      422,
      requestContext.debug,
    );
  }

  return {
    forecastHeaderId: forecastHeaders[0].forecastHeaderId,
    forecastHeaders,
    forecastName: periodLabel,
    territoryId: forecastHeaders[0].territoryId,
  };
}

function normalizeFullYearForecastHeaders(
  fullYearForecasts,
  activeForecast,
  periodLabel,
) {
  const forecastHeaders = fullYearForecasts.map((forecast) => ({
    ...forecast,
    forecastName: forecast.forecastName || periodLabel,
    territoryId: forecast.territoryId ?? activeForecast.territoryId,
  }));

  if (periodLabel !== PERIOD_ROLLING_QUARTERS) {
    return forecastHeaders;
  }

  return forecastHeaders.slice(0, 4);
}

async function requestPreviousNextQuarter(
  requestContext,
  activeForecast,
  quarter,
  periodLabel,
  requestLabel,
) {
  const periodForecasts = await fetchJson(
    requestContext,
    requestLabel,
    getPreviousNextHeaderUrl(activeForecast, quarter),
    {
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      method: "GET",
    },
  );

  if (!Array.isArray(periodForecasts) || periodForecasts.length === 0) {
    throw new SalesCenterRequestError(
      `Forecast ${quarter} nao retornou registros para ${periodLabel}.`,
      404,
      requestContext.debug,
    );
  }

  const periodForecast = {
    ...periodForecasts[0],
    forecastName: periodForecasts[0].forecastName || periodLabel,
    territoryId: periodForecasts[0].territoryId ?? activeForecast.territoryId,
  };

  if (!periodForecast.forecastHeaderId || !periodForecast.startDate || !periodForecast.endDate) {
    throw new SalesCenterRequestError(
      `Forecast ${quarter} retornou header incompleto para ${periodLabel}.`,
      422,
      requestContext.debug,
    );
  }

  return periodForecast;
}

function getForecastActiveUrl() {
  return (
    `${API_BASE}/resources/forecast/ACTIVE?v=${getCurrentYear()}${REQUEST_VERSION_SUFFIX}` +
    `&_=${Date.now()}`
  );
}

function getPreviousNextHeaderUrl(activeForecast, quarter) {
  const params = new URLSearchParams({
    v: `${getCurrentYear()}${REQUEST_VERSION_SUFFIX}`,
    territoryId: String(activeForecast.territoryId),
    forecastHeaderId: String(activeForecast.forecastHeaderId),
    forecastHeaderType: "REVENUE",
    quarter,
    _: String(Date.now()),
  });

  return `${API_BASE}/resources/forecast/previousNextHeader?${params.toString()}`;
}

function getYearForecastHeaderUrl(activeForecast, periodLabel) {
  const params = new URLSearchParams({
    v: `${getCurrentYear()}${REQUEST_VERSION_SUFFIX}`,
    forecastHeaderType: "REVENUE",
    territoryId: String(activeForecast.territoryId),
    _: String(Date.now()),
  });
  const resourceName = periodLabel === PERIOD_ROLLING_QUARTERS
    ? "rollingYearForecastHeader"
    : "fullYearForecastHeader";

  return `${API_BASE}/resources/unforecast/${resourceName}?${params.toString()}`;
}

async function requestRevenueItemsPaginated(requestContext, forecast) {
  const items = [];
  let offset = 0;
  let pageCount = 0;

  while (pageCount < MAX_REVENUE_PAGES) {
    const pageResponse = await requestRevenueItems(
      requestContext,
      forecast,
      offset,
    );
    const extraction = extractRevenueItemsWithMeta(pageResponse);
    const pageItems = extraction.items;
    pageCount += 1;
    requestContext.debug.revenueExtraction.push({
      candidatePaths: extraction.candidates.map((candidate) => candidate.path),
      itemCount: pageItems.length,
      offset,
      selectedPath: extraction.path,
    });
    publishRevenueProgress(requestContext, pageResponse, pageItems.length, offset, pageCount);

    if (pageItems.length === 0) {
      break;
    }

    items.push(...pageItems);

    if (pageItems.length < REVENUE_PAGE_LIMIT) {
      break;
    }

    offset += REVENUE_PAGE_LIMIT;
  }

  if (pageCount >= MAX_REVENUE_PAGES) {
    throw new SalesCenterRequestError(
      "A paginação de oportunidades atingiu o limite de segurança.",
      508,
      requestContext.debug,
    );
  }

  return { items, pageCount };
}

async function requestRevenueItems(requestContext, forecast, offset) {
  const url = `${API_BASE}/salespipeline/revenueLineItems/search?v=${getCurrentYear()}${REQUEST_VERSION_SUFFIX}`;
  return fetchJson(requestContext, "requestRevenueItems", url, {
    body: JSON.stringify(
      createRevenuePayload(forecast, offset, {
        renewalForecast: requestContext.renewalForecast,
        selectedTerritoryIds: requestContext.selectedTerritoryIds,
        techCloudView: requestContext.techCloudView,
      }),
    ),
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "Accept-Language": "en-US",
      "Content-Type": "application/json",
    },
    method: "POST",
  });
}

function publishRevenueProgress(requestContext, pageResponse, pageItemCount, offset, pageCount) {
  const metadata = extractPaginationMetadata(pageResponse);
  const pagination = calculateRevenuePaginationProgress(
    metadata,
    pageItemCount,
    offset,
    pageCount,
  );

  publishProgress(requestContext, {
    count: pagination.count,
    currentPage: pagination.currentPage,
    label: pagination.totalPages
      ? `Carregando oportunidades (${pagination.currentPage}/${pagination.totalPages})`
      : "Carregando oportunidades",
    limit: pagination.limit,
    loaded: pagination.loaded,
    offset: pagination.offset,
    pageCount,
    progress: pagination.progress,
    remainingPages: pagination.remainingPages,
    stage: "revenue",
    totalPages: pagination.totalPages,
    totalResults: pagination.totalResults,
  });
}

function calculateRevenuePaginationProgress(metadata, pageItemCount, offset, pageCount) {
  const limit = getPositiveNumber(metadata.limit) ?? REVENUE_PAGE_LIMIT;
  const responseOffset = metadata.offset ?? offset;
  const responseCount = metadata.count ?? pageItemCount;
  const loaded = Number.isFinite(responseOffset) && Number.isFinite(responseCount)
    ? responseOffset + responseCount
    : offset + pageItemCount;
  const totalResults = metadata.totalResults;
  const inferredTotalResults = Number.isFinite(totalResults)
    ? totalResults
    : inferFinalTotalResults(responseOffset, responseCount, limit);

  if (Number.isFinite(inferredTotalResults)) {
    const totalPages = inferredTotalResults > 0
      ? Math.max(1, Math.ceil(inferredTotalResults / limit))
      : 1;
    const currentPage = inferredTotalResults > 0
      ? Math.min(totalPages, Math.floor(responseOffset / limit) + 1)
      : 1;
    const loadedRatio = inferredTotalResults > 0
      ? Math.min(1, Math.max(0, loaded / inferredTotalResults))
      : 1;

    return {
      count: responseCount,
      currentPage,
      limit,
      loaded,
      offset: responseOffset,
      progress: REVENUE_PROGRESS_START + (loadedRatio * (REVENUE_PROGRESS_END - REVENUE_PROGRESS_START)),
      remainingPages: Math.max(0, totalPages - currentPage),
      totalPages,
      totalResults: inferredTotalResults,
    };
  }

  return {
    count: responseCount,
    currentPage: null,
    limit,
    loaded,
    offset: responseOffset,
    progress: Math.min(REVENUE_PROGRESS_END - 2, REVENUE_PROGRESS_START + (pageCount * 6)),
    remainingPages: null,
    totalPages: null,
    totalResults: null,
  };
}

function inferFinalTotalResults(offset, count, limit) {
  if (!Number.isFinite(offset) || !Number.isFinite(count) || !Number.isFinite(limit)) {
    return null;
  }

  if (count < limit) {
    return offset + count;
  }

  return null;
}

function extractPaginationMetadata(response) {
  const metadata = findPaginationMetadata(response, 0, new WeakSet()) || {};
  const count = toFiniteNumber(metadata.count);
  const limit = toFiniteNumber(metadata.limit);
  const offset = toFiniteNumber(metadata.offset);
  const totalResults = toFiniteNumber(metadata.totalResults ?? metadata.totalCount);
  const loaded = Number.isFinite(offset) && Number.isFinite(count)
    ? offset + count
    : null;

  return {
    count: Number.isFinite(count) ? count : null,
    limit: Number.isFinite(limit) ? limit : null,
    loaded,
    offset: Number.isFinite(offset) ? offset : null,
    totalResults: Number.isFinite(totalResults) ? totalResults : null,
  };
}

function getPositiveNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function findPaginationMetadata(value, depth, visited) {
  if (depth > 6 || value === null || value === undefined || typeof value !== "object") {
    return null;
  }

  if (visited.has(value)) {
    return null;
  }
  visited.add(value);

  if (!Array.isArray(value)) {
    const hasPaginationShape =
      ("totalResults" in value || "totalCount" in value) &&
      ("count" in value || "offset" in value);

    if (hasPaginationShape) {
      return value;
    }

    for (const nestedValue of Object.values(value)) {
      const metadata = findPaginationMetadata(nestedValue, depth + 1, visited);
      if (metadata) {
        return metadata;
      }
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const metadata = findPaginationMetadata(item, depth + 1, visited);
      if (metadata) {
        return metadata;
      }
    }
  }

  return null;
}

function toFiniteNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

function createRevenuePayload(forecast, offset, options = {}) {
  const payload = {
    coverage: [],
    deploymentType: [],
    forecastHeaders: createForecastHeadersPayload(forecast),
    licenseSAAS: [],
    limit: REVENUE_PAGE_LIMIT,
    months: [],
    ...(options.techCloudView
      ? { optyType: ["TECH_CLOUD_CONSUMPTION"] }
      : {}),
    myDirectsResourcesMinusOne: [],
    myDirectsResourcesMinusTwo: [],
    myDirectsTerritoriesMinusOne: [],
    myDirectsTerritoriesMinusTwo: [],
    offset,
    optyStatus: [],
    productClass: [],
    productGroup: [],
    productLine: [],
    productLob: [],
    productPillar: [],
    quarters: [],
    quoteStatus: [],
    resourceType: [],
    revenueStatus: [],
    revenueType: [],
    revenueTypeCategory: [],
    salesChannel: [],
    salesCreditTypeCode: null,
    sortOrder: "DESC",
    ...(options.renewalForecast
      ? { isRenewalForecast: true }
      : {}),
    splitParentRevnId: null,
    splitPercent: [],
    splitPercentFrom: null,
    splitPercentTo: null,
    splitTypeCode: [],
    territoryIds: createTerritoryIdsPayload(forecast, options.selectedTerritoryIds),
    winProbability: [],
  };

  return payload;
}

function createForecastHeadersPayload(forecast) {
  const headers = Array.isArray(forecast.forecastHeaders)
    ? forecast.forecastHeaders
    : [forecast];

  return headers.map((forecastHeader) => {
    if (!forecastHeader.forecastHeaderId) {
      throw new SalesCenterRequestError(
        "Forecast header retornou sem forecastHeaderId para montar o payload.",
        422,
      );
    }

    return {
      endDate: timestampToIsoDate(forecastHeader.endDate),
      id: forecastHeader.forecastHeaderId,
      startDate: timestampToIsoDate(forecastHeader.startDate),
    };
  });
}

function createTerritoryIdsPayload(forecast, selectedTerritoryIds = []) {
  const normalizedSelectedTerritoryIds = normalizeTerritoryIds(selectedTerritoryIds);

  if (normalizedSelectedTerritoryIds.length > 0) {
    return normalizedSelectedTerritoryIds.map((territoryId) => {
      const numericTerritoryId = Number(territoryId);
      return Number.isFinite(numericTerritoryId) ? numericTerritoryId : territoryId;
    });
  }

  const headers = Array.isArray(forecast.forecastHeaders)
    ? forecast.forecastHeaders
    : [forecast];

  return Array.from(
    new Set(
      headers
        .map((forecastHeader) => forecastHeader.territoryId)
        .filter((territoryId) => territoryId !== null && territoryId !== undefined),
    ),
  );
}

async function fetchJson(requestContext, label, url, options) {
  recordRequestStart(requestContext.debug, label, url, options);

  try {
    const response = await fetchJsonInSalesCloudFrame(
      requestContext,
      url,
      options,
    );
    recordRequestEnd(requestContext.debug, label, response);
    return parseFetchJsonResponse(requestContext, label, url, response);
  } catch (error) {
    if (!isRecoverableSessionError(error)) {
      throw error;
    }

    return retryFetchJsonWithAvailableSession(
      requestContext,
      label,
      url,
      options,
      error,
    );
  }
}

function parseFetchJsonResponse(requestContext, label, url, response) {
  const text = response.text;

  if (!response.ok) {
    throw new SalesCenterRequestError(
      buildRequestErrorMessage(response, text),
      response.status,
      requestContext.debug,
      {
        code: response.status === 401 || response.status === 403
          ? "SESSION_HTTP"
          : "HTTP_ERROR",
        label,
      },
    );
  }

  if (!text) {
    return null;
  }

  return parseJsonResponse(text, url, response.status, requestContext.debug, label);
}

async function retryFetchJsonWithAvailableSession(
  requestContext,
  label,
  url,
  options,
  firstError,
) {
  requestContext.debug.sessionRecovery.push({
    firstError: firstError.message,
    label,
    startedAt: new Date().toISOString(),
  });

  await ensureSalesCloudExecutionContext(requestContext, {
    forceTemporaryTab: true,
    reason: firstError.message,
  });
  await warmSalesCloudSession(requestContext);

  const retryLabel = `${label}:frameRetry`;
  recordRequestStart(requestContext.debug, retryLabel, url, options);

  try {
    const retryResponse = await fetchJsonInSalesCloudFrame(requestContext, url, options);
    recordRequestEnd(requestContext.debug, retryLabel, retryResponse);
    return parseFetchJsonResponse(requestContext, label, url, retryResponse);
  } catch (retryError) {
    if (!isRecoverableSessionError(retryError)) {
      throw retryError;
    }

    if (requestContext.temporarySalesCloudTabId) {
      await createTemporarySalesCloudTabContext(requestContext, {
        reason: retryError.message,
      });

      const refreshedRetryLabel = `${label}:temporaryTabRefreshRetry`;
      recordRequestStart(requestContext.debug, refreshedRetryLabel, url, options);

      try {
        const refreshedRetryResponse = await fetchJsonInSalesCloudFrame(
          requestContext,
          url,
          options,
        );
        recordRequestEnd(
          requestContext.debug,
          refreshedRetryLabel,
          refreshedRetryResponse,
        );
        return parseFetchJsonResponse(
          requestContext,
          label,
          url,
          refreshedRetryResponse,
        );
      } catch (refreshedRetryError) {
        if (!isRecoverableSessionError(refreshedRetryError)) {
          throw refreshedRetryError;
        }

        requestContext.debug.sessionRecovery.push({
          error: refreshedRetryError.message,
          label,
          step: "temporaryTabRefreshRetryFailed",
        });
      }
    }

    const extensionLabel = `${label}:extensionFetch`;
    recordRequestStart(requestContext.debug, extensionLabel, url, options);
    const extensionResponse = await fetchJsonInExtensionContext(url, options);
    recordRequestEnd(requestContext.debug, extensionLabel, extensionResponse);
    return parseFetchJsonResponse(requestContext, label, url, extensionResponse);
  }
}

async function fetchJsonInSalesCloudFrame(requestContext, url, options) {
  let executionResult;

  try {
    [executionResult] = await chrome.scripting.executeScript({
      args: [
        {
          fetchOptions: {
            body: options.body || null,
            headers: options.headers || {},
            method: options.method || "GET",
          },
          url,
        },
      ],
      func: async ({ url: requestUrl, fetchOptions }) => {
        const response = await fetch(requestUrl, {
          body: fetchOptions.body,
          cache: "no-store",
          credentials: "include",
          headers: fetchOptions.headers,
          method: fetchOptions.method,
        });
        const text = await response.text();

        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          text,
        };
      },
      target: {
        frameIds: [requestContext.executionFrameId ?? requestContext.frameId],
        tabId: requestContext.executionTabId ?? requestContext.tabId,
      },
      world: "MAIN",
    });
  } catch (error) {
    throw new SalesCenterRequestError(
      "Nao foi possivel executar a request no contexto SalesCloud.",
      500,
      requestContext.debug,
      {
        code: "SESSION_EXECUTION_UNAVAILABLE",
        details: error?.message || String(error),
      },
    );
  }

  if (!executionResult?.result) {
    throw new SalesCenterRequestError(
      "Nao foi possivel executar a request no contexto SalesCloud.",
      500,
      requestContext.debug,
      { code: "SESSION_EXECUTION_UNAVAILABLE" },
    );
  }

  return executionResult.result;
}

async function fetchJsonInExtensionContext(url, options) {
  const response = await fetch(url, {
    body: options.body || null,
    cache: "no-store",
    credentials: "include",
    headers: options.headers || {},
    method: options.method || "GET",
    referrer: SALES_CLOUD_REFERER,
    referrerPolicy: "strict-origin-when-cross-origin",
  });
  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    text,
  };
}

async function warmSalesCloudSession(requestContext) {
  const [executionResult] = await chrome.scripting.executeScript({
    args: [{ referer: SALES_CLOUD_REFERER }],
    func: async ({ referer }) => {
      const result = {
        href: window.location.href,
        readyState: document.readyState,
        storageHints: [],
      };

      try {
        await fetch(referer, {
          cache: "reload",
          credentials: "include",
          method: "GET",
        });
      } catch (error) {
        result.fetchError = error?.message || String(error);
      }

      try {
        const storages = [window.localStorage, window.sessionStorage];
        for (const storage of storages) {
          for (let index = 0; index < storage.length; index += 1) {
            const key = storage.key(index);
            if (/auth|session/i.test(key || "")) {
              result.storageHints.push(key);
            }
          }
        }
      } catch (error) {
        result.storageError = error?.message || String(error);
      }

      return result;
    },
    target: {
      frameIds: [requestContext.executionFrameId ?? requestContext.frameId],
      tabId: requestContext.executionTabId ?? requestContext.tabId,
    },
    world: "MAIN",
  });

  requestContext.debug.sessionRecovery.push({
    completedAt: new Date().toISOString(),
    frame: executionResult?.result || null,
    step: "warmSalesCloudSession",
  });
  await delay(1000);
}

async function prepareSalesCloudFrameStorageAccess(requestContext) {
  try {
    const [executionResult] = await chrome.scripting.executeScript({
      func: async () => {
        const result = {
          hasStorageAccess: null,
          requestStorageAccess: "unavailable",
        };

        if (typeof document.hasStorageAccess === "function") {
          result.hasStorageAccess = await document.hasStorageAccess();
        }

        if (!result.hasStorageAccess && typeof document.requestStorageAccess === "function") {
          try {
            await document.requestStorageAccess();
            result.requestStorageAccess = "granted";
            result.hasStorageAccess = typeof document.hasStorageAccess === "function"
              ? await document.hasStorageAccess()
              : true;
          } catch (error) {
            result.requestStorageAccess = "denied";
            result.error = error?.message || String(error);
          }
        }

        return result;
      },
      target: {
        frameIds: [requestContext.executionFrameId ?? requestContext.frameId],
        tabId: requestContext.executionTabId ?? requestContext.tabId,
      },
      world: "MAIN",
    });

    requestContext.debug.sessionRecovery.push({
      result: executionResult?.result || null,
      step: "prepareSalesCloudFrameStorageAccess",
      triggeredAt: new Date().toISOString(),
    });
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      error: error?.message || String(error),
      step: "prepareSalesCloudFrameStorageAccess",
      triggeredAt: new Date().toISOString(),
    });
  }
}

function setSalesCloudExecutionContext(requestContext, tabId, frameId, source) {
  requestContext.executionTabId = tabId;
  requestContext.executionFrameId = frameId;
  requestContext.executionSource = source;
  requestContext.debug.executionContext = {
    frameId,
    source,
    tabId,
    updatedAt: new Date().toISOString(),
  };
}

async function preferExistingSalesCloudTabContext(requestContext) {
  const context = await findExistingSalesCloudTabContext(requestContext);

  if (!context) {
    return false;
  }

  setSalesCloudExecutionContext(
    requestContext,
    context.tabId,
    context.frameId,
    "existing gxpap-e.oracle.com tab",
  );
  if (!await probeSalesCloudApiReadyOnce(requestContext, context.tabId, context.frameId)) {
    requestContext.debug.sessionRecovery.push({
      href: context.href,
      readyState: context.readyState,
      step: "preferExistingSalesCloudTabContext",
      usable: false,
    });
    return false;
  }

  requestContext.debug.sessionRecovery.push({
    href: context.href,
    readyState: context.readyState,
    step: "preferExistingSalesCloudTabContext",
    switchedAt: new Date().toISOString(),
  });
  return true;
}

async function ensureSalesCloudExecutionContext(requestContext, options = {}) {
  if (
    !options.forceTemporaryTab &&
    await preferExistingSalesCloudTabContext(requestContext)
  ) {
    return true;
  }

  if (!options.forceTemporaryTab) {
    try {
      const frameId = await waitForSalesCloudFrame(requestContext);
      setSalesCloudExecutionContext(
        requestContext,
        requestContext.tabId,
        frameId,
        "hidden iframe in current Oracle HCM tab",
      );
      await prepareSalesCloudFrameStorageAccess(requestContext);
      if (!await probeSalesCloudApiReadyOnce(requestContext, requestContext.tabId, frameId)) {
        throw new SalesCenterRequestError(
          "Iframe SalesCloudSMC-GEC carregou, mas a API ainda retornou sessao invalida.",
          401,
          requestContext.debug,
          { code: "SESSION_HTML" },
        );
      }

      requestContext.debug.sessionRecovery.push({
        frameId,
        step: "ensureSalesCloudExecutionContext",
        switchedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      requestContext.debug.sessionRecovery.push({
        error: error?.message || String(error),
        reason: "hidden iframe unavailable",
        step: "ensureSalesCloudExecutionContext",
      });
    }
  }

  return createTemporarySalesCloudTabContext(requestContext, {
    reason: options.reason || "automatic first-party session recovery",
  });
}

async function createTemporarySalesCloudTabContext(requestContext, options = {}) {
  let tabId = requestContext.temporarySalesCloudTabId;

  if (!tabId) {
    try {
      const tab = await chrome.tabs.create({
        active: false,
        url: SALES_CLOUD_BOOTSTRAP_URL,
      });
      tabId = tab.id;
      requestContext.temporarySalesCloudTabId = tabId;
      requestContext.debug.sessionRecovery.push({
        reason: options.reason || null,
        step: "createTemporarySalesCloudTabContext",
        tabId,
        triggeredAt: new Date().toISOString(),
      });
    } catch (error) {
      throw new SalesCenterRequestError(
        "Nao foi possivel abrir o contexto temporario SalesCloud.",
        500,
        requestContext.debug,
        {
          code: "SESSION_BOOTSTRAP_UNAVAILABLE",
          details: error?.message || String(error),
        },
      );
    }
  }

  const context = await waitForSalesCloudTabContext(requestContext, tabId);
  setSalesCloudExecutionContext(
    requestContext,
    context.tabId,
    context.frameId,
    "temporary inactive gxpap-e.oracle.com tab",
  );
  requestContext.debug.sessionRecovery.push({
    frameId: context.frameId,
    href: context.href,
    readyState: context.readyState,
    step: "createTemporarySalesCloudTabContext",
    switchedAt: new Date().toISOString(),
    tabId: context.tabId,
  });
  return true;
}

async function waitForSalesCloudTabContext(requestContext, initialTabId) {
  let tabId = initialTabId;
  const timeoutAt = Date.now() + SALES_CLOUD_TAB_TIMEOUT_MS;
  let firstIncompleteAt = null;
  let forcedStabilizationRefresh = false;
  let recreateCount = 0;
  let refreshCount = 0;

  while (Date.now() < timeoutAt) {
    let tab = null;

    try {
      tab = await chrome.tabs.get(tabId);
    } catch (error) {
      throw new SalesCenterRequestError(
        "A aba temporaria SalesCloud foi fechada antes da preparacao.",
        410,
        requestContext.debug,
        {
          code: "SESSION_BOOTSTRAP_UNAVAILABLE",
          details: error?.message || String(error),
        },
      );
    }

    if (shouldNavigateBootstrapTabToSalesCloud(tab)) {
      await refreshSalesCloudTab(requestContext, tabId, {
        href: tab.url || null,
        reason: "bootstrap origin loaded",
        refreshCount,
      });
      firstIncompleteAt = Date.now();
      await delay(1500);
      continue;
    }

    const frame = await inspectSalesCloudTabFrame(requestContext, tabId);

    if (frame?.pageLooksUnauthorized) {
      if (refreshCount < SALES_CLOUD_TAB_MAX_REFRESHES) {
        refreshCount += 1;
        await refreshSalesCloudTab(requestContext, tabId, {
          href: frame.href,
          reason: "SalesCloud page showed 401",
          refreshCount,
        });
        firstIncompleteAt = Date.now();
        await delay(2000);
        continue;
      }

      if (recreateCount < SALES_CLOUD_TAB_MAX_RECREATES) {
        recreateCount += 1;
        tabId = await recreateTemporarySalesCloudTab(requestContext, tabId, {
          href: frame.href,
          reason: "SalesCloud page stayed on 401 after refreshes",
          recreateCount,
        });
        firstIncompleteAt = null;
        forcedStabilizationRefresh = false;
        refreshCount = 0;
        await delay(1500);
        continue;
      }

      throw new SalesCenterRequestError(
        "SalesCloudSMC-GEC continuou retornando 401 apos refresh automatico.",
        401,
        requestContext.debug,
        { code: "SESSION_BOOTSTRAP_UNAVAILABLE" },
      );
    }

    if (frame?.readyState === "complete") {
      if (!forcedStabilizationRefresh && refreshCount < SALES_CLOUD_TAB_MAX_REFRESHES) {
        forcedStabilizationRefresh = true;
        refreshCount += 1;
        await refreshSalesCloudTab(requestContext, tabId, {
          href: frame.href,
          reason: "first complete stabilization refresh",
          refreshCount,
        });
        firstIncompleteAt = Date.now();
        await delay(1500);
        continue;
      }

      await delay(SALES_CLOUD_API_PROBE_AFTER_COMPLETE_MS);
      if (!await probeSalesCloudApiReadyOnce(requestContext, tabId, frame.frameId)) {
        if (refreshCount < SALES_CLOUD_TAB_MAX_REFRESHES) {
          refreshCount += 1;
          await refreshSalesCloudTab(requestContext, tabId, {
            href: frame.href,
            reason: "API probe returned session HTML",
            refreshCount,
          });
          firstIncompleteAt = Date.now();
          await delay(1500);
          continue;
        }

        if (recreateCount < SALES_CLOUD_TAB_MAX_RECREATES) {
          recreateCount += 1;
          tabId = await recreateTemporarySalesCloudTab(requestContext, tabId, {
            href: frame.href,
            reason: "API probe stayed unauthorized after refreshes",
            recreateCount,
          });
          firstIncompleteAt = null;
          forcedStabilizationRefresh = false;
          refreshCount = 0;
          await delay(1500);
          continue;
        }

        await delay(1000);
        continue;
      }

      return {
        frameId: frame.frameId,
        href: frame.href,
        readyState: frame.readyState,
        tabId,
      };
    }

    if (!firstIncompleteAt) {
      firstIncompleteAt = Date.now();
    }

    if (
      Date.now() - firstIncompleteAt >= SALES_CLOUD_TAB_REFRESH_AFTER_MS &&
      refreshCount < SALES_CLOUD_TAB_MAX_REFRESHES
    ) {
      refreshCount += 1;
      await refreshSalesCloudTab(requestContext, tabId, {
        href: frame?.href || tab.url || null,
        reason: frame ? "incomplete readyState" : "frame not ready",
        refreshCount,
      });
      firstIncompleteAt = Date.now();
    }

    await delay(750);
  }

  throw new SalesCenterRequestError(
    "SalesCloudSMC-GEC nao terminou de carregar no contexto temporario.",
    408,
    requestContext.debug,
    { code: "SESSION_BOOTSTRAP_TIMEOUT" },
  );
}

async function inspectSalesCloudTabFrame(requestContext, tabId) {
  try {
    const frames = await chrome.scripting.executeScript({
      func: () => ({
        bodyPreview: document.body?.innerText?.slice(0, 1000) || "",
        href: window.location.href,
        readyState: document.readyState,
        title: document.title,
      }),
      target: { allFrames: true, tabId },
    });

    const frame = frames.find(
      (candidate) =>
        candidate.result?.href?.startsWith(SALES_CLOUD_REFERER) &&
        candidate.result?.readyState === "complete",
    ) || frames.find(
      (candidate) =>
        candidate.result?.href?.startsWith(`${API_ORIGIN}/oalcrm/web/`) &&
        candidate.result?.readyState === "complete",
    ) || frames.find(
      (candidate) =>
        candidate.result?.href?.startsWith(`${API_ORIGIN}/oalcrm/web/`),
    );

    if (!frame?.result) {
      return null;
    }

    requestContext.debug.sessionRecovery.push({
      frameId: frame.frameId,
      href: frame.result.href,
      pageLooksUnauthorized: looksLikeUnauthorizedPage(
        frame.result.title,
        frame.result.bodyPreview,
      ),
      readyState: frame.result.readyState,
      step: "inspectSalesCloudTabFrame",
      tabId,
      title: frame.result.title || "",
    });

    return {
      frameId: frame.frameId,
      href: frame.result.href,
      pageLooksUnauthorized: looksLikeUnauthorizedPage(
        frame.result.title,
        frame.result.bodyPreview,
      ),
      readyState: frame.result.readyState,
    };
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      error: error?.message || String(error),
      step: "inspectSalesCloudTabFrame",
      tabId,
    });
    return null;
  }
}

async function probeSalesCloudApiReadyOnce(requestContext, tabId, frameId) {
  try {
    const [executionResult] = await chrome.scripting.executeScript({
      args: [
        {
          headers: {
            Accept: "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          url: getForecastActiveUrl(),
        },
      ],
      func: async ({ headers, url }) => {
        const response = await fetch(url, {
          cache: "no-store",
          credentials: "include",
          headers,
          method: "GET",
        });
        const text = await response.text();
        const preview = text.slice(0, 500);
        const normalizedPreview = preview.trim().toLowerCase();
        const looksLikeHtml =
          normalizedPreview.startsWith("<!doctype") ||
          normalizedPreview.startsWith("<html") ||
          normalizedPreview.includes("<html") ||
          normalizedPreview.includes("<form") ||
          normalizedPreview.includes("login") ||
          normalizedPreview.includes("signin");
        let jsonReady = false;

        if (!looksLikeHtml && text.trim()) {
          try {
            let preparedText = text.trim().replace(/^\uFEFF/, "");
            for (const guard of [")]}'", ")]}',", "while(1);", "for(;;);"]) {
              if (preparedText.startsWith(guard)) {
                preparedText = preparedText.slice(guard.length).trim();
                break;
              }
            }

            JSON.parse(preparedText);
            jsonReady = true;
          } catch (error) {
            jsonReady = false;
          }
        }

        return {
          bodySize: text.length,
          contentType: response.headers.get("content-type") || "",
          ok: response.ok,
          preview,
          ready: response.ok && jsonReady,
          sessionHtml: looksLikeHtml,
          status: response.status,
          statusText: response.statusText,
        };
      },
      target: {
        frameIds: [frameId],
        tabId,
      },
      world: "MAIN",
    });
    const result = executionResult?.result || null;

    requestContext.debug.sessionRecovery.push({
      bodySize: result?.bodySize || 0,
      contentType: result?.contentType || "",
      frameId,
      ok: result?.ok === true,
      ready: result?.ready === true,
      sessionHtml: result?.sessionHtml === true,
      status: result?.status || null,
      step: "probeSalesCloudApiReadyOnce",
      tabId,
    });

    return result?.ready === true;
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      error: error?.message || String(error),
      frameId,
      step: "probeSalesCloudApiReadyOnce",
      tabId,
    });
    return false;
  }
}

async function refreshSalesCloudTab(requestContext, tabId, details) {
  try {
    const tab = await chrome.tabs.get(tabId);

    if (tab.url?.startsWith(SALES_CLOUD_REFERER)) {
      await chrome.tabs.reload(tabId, { bypassCache: true });
    } else {
      await chrome.tabs.update(tabId, { url: SALES_CLOUD_REFERER });
    }

    requestContext.debug.sessionRecovery.push({
      ...details,
      step: "refreshSalesCloudTab",
      triggeredAt: new Date().toISOString(),
      tabId,
    });
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      ...details,
      error: error?.message || String(error),
      step: "refreshSalesCloudTab",
      triggeredAt: new Date().toISOString(),
      tabId,
    });
  }
}

function shouldNavigateBootstrapTabToSalesCloud(tab) {
  const url = tab?.url || "";

  return (
    tab?.status === "complete" &&
    (
      url === SALES_CLOUD_BOOTSTRAP_URL ||
      url === API_ORIGIN ||
      (
        url.startsWith(API_ORIGIN) &&
        !url.startsWith(`${API_ORIGIN}/oalcrm/web/`)
      ) ||
      url.startsWith("chrome-error://")
    )
  );
}

async function recreateTemporarySalesCloudTab(requestContext, currentTabId, details) {
  try {
    await chrome.tabs.remove(currentTabId);
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      ...details,
      error: error?.message || String(error),
      step: "removeTemporarySalesCloudTabBeforeRecreate",
      tabId: currentTabId,
    });
  }

  try {
    const tab = await chrome.tabs.create({
      active: false,
      url: SALES_CLOUD_BOOTSTRAP_URL,
    });
    requestContext.temporarySalesCloudTabId = tab.id;
    requestContext.debug.sessionRecovery.push({
      ...details,
      newTabId: tab.id,
      previousTabId: currentTabId,
      step: "recreateTemporarySalesCloudTab",
      triggeredAt: new Date().toISOString(),
    });
    return tab.id;
  } catch (error) {
    throw new SalesCenterRequestError(
      "Nao foi possivel recriar o contexto temporario SalesCloud.",
      500,
      requestContext.debug,
      {
        code: "SESSION_BOOTSTRAP_UNAVAILABLE",
        details: error?.message || String(error),
      },
    );
  }
}

async function closeTemporarySalesCloudTab(requestContext) {
  const tabId = requestContext.temporarySalesCloudTabId;

  if (!tabId) {
    return;
  }

  requestContext.temporarySalesCloudTabId = null;

  try {
    await chrome.tabs.remove(tabId);
    requestContext.debug.sessionRecovery.push({
      closedAt: new Date().toISOString(),
      step: "closeTemporarySalesCloudTab",
      tabId,
    });
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      error: error?.message || String(error),
      step: "closeTemporarySalesCloudTab",
      tabId,
    });
  }
}

async function findExistingSalesCloudTabContext(requestContext) {
  let tabs = [];

  try {
    tabs = await chrome.tabs.query({ url: `${API_ORIGIN}/*` });
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      error: error?.message || String(error),
      step: "findExistingSalesCloudTabContext",
    });
    return null;
  }

  for (const tab of tabs) {
    if (!tab.id || tab.id === requestContext.tabId) {
      continue;
    }

    try {
      const frames = await chrome.scripting.executeScript({
        func: () => ({
          href: window.location.href,
          readyState: document.readyState,
        }),
        target: { allFrames: true, tabId: tab.id },
      });
      const frame = frames.find(
        (candidate) =>
          candidate.result?.href?.startsWith(SALES_CLOUD_REFERER) &&
          candidate.result?.readyState === "complete",
      ) || frames.find(
        (candidate) =>
          candidate.result?.href?.startsWith(`${API_ORIGIN}/oalcrm/web/`) &&
          candidate.result?.readyState === "complete",
      );

      if (frame) {
        return {
          frameId: frame.frameId,
          href: frame.result.href,
          readyState: frame.result.readyState,
          tabId: tab.id,
        };
      }
    } catch (error) {
      requestContext.debug.sessionRecovery.push({
        error: error?.message || String(error),
        step: "inspectExistingSalesCloudTab",
        tabId: tab.id,
      });
    }
  }

  return null;
}

async function waitForSalesCloudFrame(requestContext) {
  if (!requestContext.tabId || !requestContext.debug?.frameName) {
    throw new SalesCenterRequestError(
      "Contexto do iframe SalesCloudSMC-GEC não foi informado.",
      400,
      requestContext.debug,
    );
  }

  const timeoutAt = Date.now() + 60000;
  let firstIncompleteAt = null;
  let forcedStabilizationRefresh = false;
  let lastFrameId = null;
  let refreshCount = 0;

  while (Date.now() < timeoutAt) {
    const frames = await chrome.scripting.executeScript({
      func: () => ({
        frameName: window.name || "",
        href: window.location.href,
        readyState: document.readyState,
      }),
      target: { allFrames: true, tabId: requestContext.tabId },
    });
    const namedFrame = frames.find(
      (frame) => frame.result?.frameName === requestContext.debug.frameName,
    );
    const salesCloudFrame = frames.find(
      (frame) =>
        frame.result?.frameName === requestContext.debug.frameName &&
        frame.result?.href?.startsWith(SALES_CLOUD_REFERER),
    );

    if (salesCloudFrame?.result?.readyState === "complete") {
      if (!forcedStabilizationRefresh && refreshCount < SALES_CLOUD_FRAME_MAX_REFRESHES) {
        forcedStabilizationRefresh = true;
        refreshCount += 1;
        await refreshSalesCloudFrame(requestContext, {
          href: salesCloudFrame.result.href,
          reason: "first complete stabilization refresh",
          refreshCount,
        });
        firstIncompleteAt = Date.now();
        await delay(1000);
        continue;
      }

      requestContext.debug.sessionFrame = {
        frameId: salesCloudFrame.frameId,
        href: salesCloudFrame.result.href,
        readyState: salesCloudFrame.result.readyState,
      };
      return salesCloudFrame.frameId;
    }

    const refreshCandidate = salesCloudFrame || namedFrame;

    if (refreshCandidate?.result) {
      requestContext.debug.sessionFrame = {
        frameId: refreshCandidate.frameId,
        href: refreshCandidate.result.href,
        readyState: refreshCandidate.result.readyState,
      };

      if (lastFrameId !== refreshCandidate.frameId) {
        firstIncompleteAt = Date.now();
        lastFrameId = refreshCandidate.frameId;
      } else if (!firstIncompleteAt) {
        firstIncompleteAt = Date.now();
      }

      if (
        Date.now() - firstIncompleteAt >= SALES_CLOUD_FRAME_REFRESH_AFTER_MS &&
        refreshCount < SALES_CLOUD_FRAME_MAX_REFRESHES
      ) {
        refreshCount += 1;
        await refreshSalesCloudFrame(requestContext, {
          href: refreshCandidate.result.href,
          reason: refreshCandidate.result.readyState === "complete"
            ? "unexpected href"
            : "incomplete readyState",
          refreshCount,
        });
        firstIncompleteAt = Date.now();
      }
    }

    await delay(500);
  }

  throw new SalesCenterRequestError(
    "Iframe SalesCloudSMC-GEC não terminou de carregar.",
    408,
    requestContext.debug,
  );
}

async function refreshSalesCloudFrame(requestContext, details) {
  try {
    const [executionResult] = await chrome.scripting.executeScript({
      args: [
        {
          frameName: requestContext.debug.frameName,
          src: SALES_CLOUD_REFERER,
        },
      ],
      func: ({ frameName, src }) => {
        const frame = Array.from(document.querySelectorAll("iframe")).find(
          (candidate) => candidate.name === frameName,
        );

        if (!frame) {
          return { refreshed: false, reason: "frame not found" };
        }

        frame.dataset.loaded = "false";
        frame.src = src;
        return { refreshed: true, src };
      },
      target: { tabId: requestContext.tabId },
    });

    requestContext.debug.sessionRecovery.push({
      ...details,
      result: executionResult?.result || null,
      step: "refreshSalesCloudFrame",
      triggeredAt: new Date().toISOString(),
    });
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      ...details,
      error: error?.message || String(error),
      step: "refreshSalesCloudFrame",
      triggeredAt: new Date().toISOString(),
    });
  }
}

function createDebugState(sessionContext) {
  return {
    frameName: sessionContext.frameName || null,
    generatedAt: new Date().toISOString(),
    period: normalizePeriod(sessionContext.period),
    requests: [],
    revenueExtraction: [],
    sessionRecovery: [],
    sessionStrategy: "existing tab, hidden iframe, then temporary inactive SalesCloud tab",
    techCloudView: sessionContext.techCloudView === true,
  };
}

function publishProgress(requestContext, progress) {
  if (!requestContext.tabId || !requestContext.progressRequestId) {
    return;
  }

  const normalizedProgress = normalizeProgressValue(progress.progress);
  requestContext.progressValue = Math.max(
    requestContext.progressValue || 0,
    normalizedProgress,
  );

  try {
    const sendResult = chrome.tabs.sendMessage(requestContext.tabId, {
      progress: {
        ...progress,
        progress: requestContext.progressValue,
        requestId: requestContext.progressRequestId,
      },
      type: "salesCenter.loadingProgress",
    });

    if (sendResult?.catch) {
      sendResult.catch(() => null);
    }
  } catch (error) {
    return;
  }
}

function normalizeProgressValue(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.min(99, numberValue));
}

function recordRequestStart(debug, label, url, options) {
  const entry = {
    body: parseJsonBody(options.body),
    headers: sanitizeHeaders(options.headers || {}),
    label,
    method: options.method || "GET",
    requestAt: new Date().toISOString(),
    response: null,
    url,
  };
  debug.requests.push(entry);
}

function recordRequestEnd(debug, label, response) {
  const entry = [...debug.requests]
    .reverse()
    .find((request) => request.label === label && !request.response);

  if (!entry) {
    return;
  }

  entry.response = {
    bodyPreview: response.text || "",
    bodySize: response.text ? response.text.length : 0,
    ok: response.ok,
    receivedAt: new Date().toISOString(),
    status: response.status,
    statusText: response.statusText,
  };
}

function sanitizeHeaders(headers) {
  const safeHeaders = {};

  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase().includes("authorization")) {
      safeHeaders[name] = value ? "[redacted]" : value;
      continue;
    }

    safeHeaders[name] = value;
  }

  return safeHeaders;
}

function parseJsonBody(body) {
  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    return body;
  }
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseJsonResponse(text, url, status, debug, label) {
  const preparedText = prepareJsonText(text);

  try {
    return JSON.parse(preparedText);
  } catch (error) {
    const code = looksLikeHtmlResponse(text) ? "SESSION_HTML" : "INVALID_JSON";
    const message =
      code === "SESSION_HTML"
        ? "Sessao gxpap-e.oracle.com indisponivel ou expirada."
        : `Resposta JSON invalida de ${new URL(url).pathname}.`;

    throw new SalesCenterRequestError(message, status, debug, {
      code,
      label,
    });
  }
}

function prepareJsonText(text) {
  let preparedText = String(text || "").trim().replace(/^\uFEFF/, "");
  const jsonGuards = [")]}'", ")]}',", "while(1);", "for(;;);"];

  for (const guard of jsonGuards) {
    if (preparedText.startsWith(guard)) {
      preparedText = preparedText.slice(guard.length).trim();
      break;
    }
  }

  return preparedText;
}

function looksLikeHtmlResponse(text) {
  const preparedText = String(text || "").trim().slice(0, 500).toLowerCase();
  return (
    preparedText.startsWith("<!doctype") ||
    preparedText.startsWith("<html") ||
    preparedText.includes("<html") ||
    preparedText.includes("<form") ||
    preparedText.includes("login") ||
    preparedText.includes("signin")
  );
}

function looksLikeUnauthorizedPage(title, bodyText) {
  const text = `${title || ""}\n${bodyText || ""}`.toLowerCase();
  return (
    text.includes("401") ||
    text.includes("unauthorized") ||
    text.includes("not authorized") ||
    text.includes("authorization required") ||
    text.includes("access denied")
  );
}

function isRecoverableSessionError(error) {
  return (
    error instanceof SalesCenterRequestError &&
    (
      error.code === "SESSION_HTML" ||
      error.code === "SESSION_HTTP" ||
      error.code === "SESSION_BOOTSTRAP_TIMEOUT" ||
      error.code === "SESSION_EXECUTION_UNAVAILABLE" ||
      error.status === 401 ||
      error.status === 403
    )
  );
}

function buildRequestErrorMessage(response, text) {
  if (response.status === 401 || response.status === 403) {
    return "Sessão gxpap-e.oracle.com indisponível ou expirada.";
  }

  const excerpt = text ? ` ${text.slice(0, 160)}` : "";
  return `Request falhou com HTTP ${response.status}.${excerpt}`;
}

function extractRevenueItems(response) {
  return extractRevenueItemsWithMeta(response).items;
}

function extractRevenueItemsWithMeta(response) {
  const candidates = [];
  collectArrayCandidates(response, "response", 0, candidates, new WeakSet());

  candidates.sort(
    (candidateA, candidateB) =>
      candidateB.score - candidateA.score ||
      candidateB.items.length - candidateA.items.length,
  );

  const bestCandidate = candidates[0];

  return {
    candidates: candidates.slice(0, 8).map((candidate) => ({
      itemCount: candidate.items.length,
      path: candidate.path,
      score: candidate.score,
    })),
    items: bestCandidate?.items || [],
    path: bestCandidate?.path || null,
  };
}

function collectArrayCandidates(value, path, depth, candidates, visited) {
  if (depth > 8 || value === null || value === undefined) {
    return;
  }

  if (typeof value === "string" && looksLikeJson(value)) {
    try {
      collectArrayCandidates(JSON.parse(value), `${path}#json`, depth + 1, candidates, visited);
    } catch (error) {
      return;
    }

    return;
  }

  if (typeof value !== "object") {
    return;
  }

  if (visited.has(value)) {
    return;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    const items = normalizeRecordArray(value);
    if (items.length > 0) {
      candidates.push({
        items,
        path,
        score: scoreRevenueArrayPath(path),
      });
    }

    value.forEach((item, index) => {
      collectArrayCandidates(item, `${path}[${index}]`, depth + 1, candidates, visited);
    });
    return;
  }

  for (const [key, nestedValue] of Object.entries(value)) {
    collectArrayCandidates(nestedValue, `${path}.${key}`, depth + 1, candidates, visited);
  }
}

function normalizeRecordArray(value) {
  const objectItems = value.filter(
    (item) => item && typeof item === "object" && !Array.isArray(item),
  );

  if (objectItems.length > 0) {
    return objectItems;
  }

  return value
    .filter(Array.isArray)
    .flatMap((nestedArray) => normalizeRecordArray(nestedArray));
}

function scoreRevenueArrayPath(path) {
  const normalizedPath = path.toLowerCase();
  let score = 0;

  if (normalizedPath.includes("revenuelineitems")) score += 1000;
  if (normalizedPath.includes("revenueitems")) score += 950;
  if (normalizedPath.includes("lineitems")) score += 900;
  if (normalizedPath.includes("items")) score += 800;
  if (normalizedPath.includes("rows")) score += 700;
  if (normalizedPath.includes("records")) score += 650;
  if (normalizedPath.includes("results")) score += 600;
  if (normalizedPath.includes("data")) score += 500;
  if (normalizedPath.includes("value")) score += 400;
  if (normalizedPath.includes("metadata")) score -= 500;
  if (normalizedPath.includes("error")) score -= 500;

  return score;
}

function looksLikeJson(value) {
  const trimmedValue = value.trim();
  return trimmedValue.startsWith("{") || trimmedValue.startsWith("[");
}

function normalizePeriod(value) {
  if (value === PERIOD_NEXT_QUARTER) {
    return PERIOD_NEXT_QUARTER;
  }

  if (value === PERIOD_PREVIOUS_QUARTER) {
    return PERIOD_PREVIOUS_QUARTER;
  }

  if (value === PERIOD_CURRENT_FISCAL_YEAR) {
    return PERIOD_CURRENT_FISCAL_YEAR;
  }

  if (value === PERIOD_ROLLING_QUARTERS) {
    return PERIOD_ROLLING_QUARTERS;
  }

  if (value === PERIOD_RENEWALS) {
    return PERIOD_RENEWALS;
  }

  return PERIOD_CURRENT_QUARTER;
}

function getCurrentYear() {
  return new Date().getFullYear();
}

function timestampToIsoDate(value) {
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) {
    throw new SalesCenterRequestError(
      `Timestamp inválido retornado pelo forecast: ${value}`,
      422,
    );
  }

  return date.toISOString().slice(0, 10);
}

class SalesCenterRequestError extends Error {
  constructor(message, status, debug, options = {}) {
    super(message);
    this.name = "SalesCenterRequestError";
    this.status = status;
    this.debug = debug;
    Object.assign(this, options);
  }
}
