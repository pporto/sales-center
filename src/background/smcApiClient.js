"use strict";

function createSmcApiClient({ fetchJson, publishProgress }) {
  const constants = globalThis.SalesCenterConstants;
  const utils = globalThis.SalesCenterUtils;
  const { SalesCenterRequestError } = globalThis.SalesCenterErrors;
  const periods = constants.PERIODS;

  async function fetchDashboardData(requestContext) {
    publishProgress(requestContext, {
      label: "Carregando forecast ativo",
      progress: 14,
      stage: "forecastActive",
    });
    const forecasts = await requestForecastActive(requestContext);

    if (!Array.isArray(forecasts) || forecasts.length === 0) {
      throw new SalesCenterRequestError(
        "Forecast ACTIVE nao retornou registros para Current Quarter.",
        404,
        requestContext.debug,
      );
    }

    const revenueForecasts = forecasts.filter(isRevenueForecast);
    if (revenueForecasts.length === 0) {
      throw new SalesCenterRequestError(
        "Forecast ACTIVE nao retornou registros REVENUE para Current Quarter.",
        404,
        requestContext.debug,
      );
    }

    const forecastActiveOptions = createForecastActiveOptions(revenueForecasts);
    const selectedTerritoryIds = selectTerritoryIds(
      forecastActiveOptions,
      requestContext.selectedTerritoryIds,
    );
    const activeForecast = selectActiveForecast(revenueForecasts, selectedTerritoryIds);
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
    const revenueResult = await requestRevenueItemsPaginated(requestContext, forecast);

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

  async function resolveForecastForPeriod(requestContext, activeForecast) {
    if (requestContext.period === periods.NEXT_QUARTER) {
      return requestPreviousNextQuarter(
        requestContext,
        activeForecast,
        "NEXT",
        periods.NEXT_QUARTER,
        "requestNextQuarter",
      );
    }

    if (requestContext.period === periods.PREVIOUS_QUARTER) {
      return requestPreviousNextQuarter(
        requestContext,
        activeForecast,
        "PREVIOUS",
        periods.PREVIOUS_QUARTER,
        "requestPreviousQuarter",
      );
    }

    if (requestContext.period === periods.CURRENT_FISCAL_YEAR) {
      return requestFullYearForecast(
        requestContext,
        activeForecast,
        periods.CURRENT_FISCAL_YEAR,
        "requestFullYearForecast",
      );
    }

    if (requestContext.period === periods.ROLLING_QUARTERS) {
      return requestFullYearForecast(
        requestContext,
        activeForecast,
        periods.ROLLING_QUARTERS,
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

  async function requestRevenueItemsPaginated(requestContext, forecast) {
    const items = [];
    let offset = 0;
    let pageCount = 0;

    while (pageCount < constants.MAX_REVENUE_PAGES) {
      const pageResponse = await requestRevenueItems(requestContext, forecast, offset);
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

      if (pageItems.length < constants.REVENUE_PAGE_LIMIT) {
        break;
      }

      offset += constants.REVENUE_PAGE_LIMIT;
    }

    if (pageCount >= constants.MAX_REVENUE_PAGES) {
      throw new SalesCenterRequestError(
        "A paginacao de oportunidades atingiu o limite de seguranca.",
        508,
        requestContext.debug,
      );
    }

    return { items, pageCount };
  }

  async function requestRevenueItems(requestContext, forecast, offset) {
    const url = `${constants.API_BASE}/salespipeline/revenueLineItems/search?v=${utils.getCurrentYear()}${constants.REQUEST_VERSION_SUFFIX}`;
    return fetchJson(requestContext, "requestRevenueItems", url, {
      body: JSON.stringify(
        createRevenuePayload(forecast, offset, {
          renewalForecast: requestContext.renewalForecast,
          selectedTerritoryIds: requestContext.selectedTerritoryIds,
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

  function getForecastActiveUrl() {
    return (
      `${constants.API_BASE}/resources/forecast/ACTIVE?v=${utils.getCurrentYear()}${constants.REQUEST_VERSION_SUFFIX}` +
      `&_=${Date.now()}`
    );
  }

  function getPreviousNextHeaderUrl(activeForecast, quarter) {
    const params = new URLSearchParams({
      v: `${utils.getCurrentYear()}${constants.REQUEST_VERSION_SUFFIX}`,
      territoryId: String(activeForecast.territoryId),
      forecastHeaderId: String(activeForecast.forecastHeaderId),
      forecastHeaderType: "REVENUE",
      quarter,
      _: String(Date.now()),
    });

    return `${constants.API_BASE}/resources/forecast/previousNextHeader?${params.toString()}`;
  }

  function getYearForecastHeaderUrl(activeForecast, periodLabel) {
    const params = new URLSearchParams({
      v: `${utils.getCurrentYear()}${constants.REQUEST_VERSION_SUFFIX}`,
      forecastHeaderType: "REVENUE",
      territoryId: String(activeForecast.territoryId),
      _: String(Date.now()),
    });
    const resourceName = periodLabel === periods.ROLLING_QUARTERS
      ? "rollingYearForecastHeader"
      : "fullYearForecastHeader";

    return `${constants.API_BASE}/resources/unforecast/${resourceName}?${params.toString()}`;
  }

  function createRevenuePayload(forecast, offset, options = {}) {
    return {
      coverage: [],
      deploymentType: [],
      forecastHeaders: createForecastHeadersPayload(forecast),
      licenseSAAS: [],
      limit: constants.REVENUE_PAGE_LIMIT,
      months: [],
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
      ...(options.renewalForecast ? { isRenewalForecast: true } : {}),
      splitParentRevnId: null,
      splitPercent: [],
      splitPercentFrom: null,
      splitPercentTo: null,
      splitTypeCode: [],
      territoryIds: createTerritoryIdsPayload(forecast, options.selectedTerritoryIds),
      winProbability: [],
    };
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
        endDate: utils.timestampToIsoDate(forecastHeader.endDate),
        id: forecastHeader.forecastHeaderId,
        startDate: utils.timestampToIsoDate(forecastHeader.startDate),
      };
    });
  }

  function createTerritoryIdsPayload(forecast, selectedTerritoryIds = []) {
    const normalizedSelectedTerritoryIds = utils.normalizeTerritoryIds(selectedTerritoryIds);

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

  return {
    createDashboardCacheKey({ period, territoryIds }) {
      const normalizedTerritoryIds = utils.normalizeTerritoryIds(territoryIds)
        .sort((territoryIdA, territoryIdB) => territoryIdA.localeCompare(territoryIdB));

      return [
        "dashboard",
        constants.REQUEST_VERSION_SUFFIX,
        utils.normalizePeriod(period),
        normalizedTerritoryIds.length ? normalizedTerritoryIds.join(",") : "default",
      ];
    },
    fetchDashboardData,
    internals: {
      createRevenuePayload,
      getForecastActiveUrl,
    },
  };
}

function isRevenueForecast(forecast) {
  return String(forecast?.forecastType || "").trim().toUpperCase() === "REVENUE";
}

function createForecastActiveOptions(forecasts) {
  const uniqueOptions = [];
  const seenTerritoryIds = new Set();

  for (const forecast of forecasts) {
    const territoryId = globalThis.SalesCenterUtils.normalizeTerritoryId(forecast.territoryId);

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
    selectedTerritoryIdSet.has(globalThis.SalesCenterUtils.normalizeTerritoryId(forecast.territoryId)),
  ) || forecasts[0];
}

function normalizeFullYearForecastHeaders(fullYearForecasts, activeForecast, periodLabel) {
  const forecastHeaders = fullYearForecasts.map((forecast) => ({
    ...forecast,
    forecastName: forecast.forecastName || periodLabel,
    territoryId: forecast.territoryId ?? activeForecast.territoryId,
  }));

  return periodLabel === globalThis.SalesCenterConstants.PERIODS.ROLLING_QUARTERS
    ? forecastHeaders.slice(0, 4)
    : forecastHeaders;
}

function calculateRevenuePaginationProgress(metadata, pageItemCount, offset, pageCount) {
  const constants = globalThis.SalesCenterConstants;
  const limit = getPositiveNumber(metadata.limit) ?? constants.REVENUE_PAGE_LIMIT;
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
      progress: constants.REVENUE_PROGRESS_START +
        (loadedRatio * (constants.REVENUE_PROGRESS_END - constants.REVENUE_PROGRESS_START)),
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
    progress: Math.min(constants.REVENUE_PROGRESS_END - 2, constants.REVENUE_PROGRESS_START + (pageCount * 6)),
    remainingPages: null,
    totalPages: null,
    totalResults: null,
  };
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

  if (typeof value !== "object" || visited.has(value)) {
    return;
  }
  visited.add(value);

  if (Array.isArray(value)) {
    const items = normalizeRecordArray(value);
    if (items.length > 0) {
      candidates.push({ items, path, score: scoreRevenueArrayPath(path) });
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

function getPositiveNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) && numberValue > 0 ? numberValue : null;
}

function inferFinalTotalResults(offset, count, limit) {
  if (!Number.isFinite(offset) || !Number.isFinite(count) || !Number.isFinite(limit)) {
    return null;
  }

  return count < limit ? offset + count : null;
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

function toFiniteNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

globalThis.SalesCenterBackground = {
  ...(globalThis.SalesCenterBackground || {}),
  createSmcApiClient,
};
