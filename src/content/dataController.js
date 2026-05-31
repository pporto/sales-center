"use strict";

function renderLoading(state) {
  setStatusPill(state, "Loading", "muted");
  state.currentDebug = null;
  state.statusRegion.replaceChildren(
    createElement("div", {
      className: "sc-inline-status",
      text: "Carregando bookings e workloads...",
    }),
  );
  clearRevenueRequestInspector(state);
  state.summaryGrid.replaceChildren(
    ...createPlaceholderSummaryTiles("-"),
  );
  state.tableBody.replaceChildren();

  for (let rowIndex = 0; rowIndex < 8; rowIndex += 1) {
    const row = createElement("tr");
    for (let colIndex = 0; colIndex < getVisibleColumnCount(state.tableState); colIndex += 1) {
      row.appendChild(
        createElement("td", {}, [
          createElement("span", { className: "sc-skeleton" }),
        ]),
      );
    }
    state.tableBody.appendChild(row);
  }
}

function renderComingSoon(state, period) {
  setStatusPill(state, "Em breve", "muted");
  state.currentDebug = null;
  clearRevenueRequestInspector(state);
  state.summaryGrid.replaceChildren(
    ...createPlaceholderSummaryTiles("-"),
  );
  state.statusRegion.replaceChildren(
    createElement("div", {
      className: "sc-inline-status",
      text: "Esta opção do período está preparada para a próxima etapa.",
    }),
  );
  renderEmptyRows(state, "Sem dados para o período selecionado.");
}

function isLoadableSalesCenterPeriod(period) {
  return (
    period === SALES_CENTER_CURRENT_QUARTER ||
    period === SALES_CENTER_NEXT_QUARTER ||
    period === SALES_CENTER_PREVIOUS_QUARTER ||
    period === SALES_CENTER_CURRENT_FISCAL_YEAR ||
    period === SALES_CENTER_ROLLING_QUARTERS ||
    period === SALES_CENTER_RENEWALS
  );
}

async function loadCurrentQuarter(state, options = {}) {
  if (state.availableTerritories.length > 0 && state.selectedTerritoryIds.size === 0) {
    renderNoTerritoriesSelected(state);
    return;
  }

  const loadingRequestId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  state.topLoaderRequestId = loadingRequestId;
  startTopLoading(state);
  renderLoading(state);

  try {
    waitForSessionFrameLoad(state.sessionFrame).catch(() => null);
    const response = await sendRuntimeMessage({
      meta: {
        frameName: state.frameName,
        requestId: loadingRequestId,
      },
      payload: {
        forceRefresh: options.forceRefresh === true,
        period: state.periodSelect.value,
        territoryIds: Array.from(state.selectedTerritoryIds || []),
      },
      type: "salesCenter.fetchDashboard",
    });

    if (!response?.ok) {
      const loadError = new Error(
        response?.error?.message ||
          "Não foi possível carregar as oportunidades.",
      );
      loadError.code = response?.error?.code || null;
      loadError.debug = response?.debug || null;
      throw loadError;
    }

    renderDashboardData(state, response.data);
  } catch (error) {
    renderDashboardError(state, error);
  } finally {
    if (state.topLoaderRequestId === loadingRequestId) {
      completeTopLoading(state);
    }
  }
}

function getSelectedWorkloadTypes(state) {
  const selectedTypes = [];

  if (state.bookingToggle.getAttribute("aria-pressed") === "true") {
    selectedTypes.push(WORKLOAD_TYPE_BOOKING);
  }

  if (state.workloadsToggle.getAttribute("aria-pressed") === "true") {
    selectedTypes.push(WORKLOAD_TYPE_WORKLOAD);
  }

  return selectedTypes;
}

function setStatusFilterAllSelected(state) {
  state.statusAllToggle.setAttribute("aria-pressed", "true");
  for (const statusToggle of state.statusToggles) {
    statusToggle.setAttribute("aria-pressed", "true");
  }
}

function toggleStatusFilterSelection(state, selectedStatus) {
  const wasAllSelected = state.statusAllToggle.getAttribute("aria-pressed") === "true";
  const selectedToggle = state.statusToggles.find(
    (statusToggle) => statusToggle.dataset.status === selectedStatus,
  );

  if (!selectedToggle) {
    return;
  }

  if (wasAllSelected) {
    for (const statusToggle of state.statusToggles) {
      statusToggle.setAttribute(
        "aria-pressed",
        String(statusToggle === selectedToggle),
      );
    }
    state.statusAllToggle.setAttribute("aria-pressed", "false");
    return;
  }

  const isSelected = selectedToggle.getAttribute("aria-pressed") === "true";
  const selectedCount = state.statusToggles.filter(
    (statusToggle) => statusToggle.getAttribute("aria-pressed") === "true",
  ).length;

  if (!isSelected) {
    selectedToggle.setAttribute("aria-pressed", "true");
  } else if (selectedCount > 1) {
    selectedToggle.setAttribute("aria-pressed", "false");
  }

  const nextSelectedCount = state.statusToggles.filter(
    (statusToggle) => statusToggle.getAttribute("aria-pressed") === "true",
  ).length;
  state.statusAllToggle.setAttribute(
    "aria-pressed",
    String(nextSelectedCount === state.statusToggles.length),
  );
}

function toggleWorkloadTypeFilterSelection(state, selectedType) {
  const selectedToggle = selectedType === WORKLOAD_TYPE_BOOKING
    ? state.bookingToggle
    : state.workloadsToggle;
  const otherToggle = selectedType === WORKLOAD_TYPE_BOOKING
    ? state.workloadsToggle
    : state.bookingToggle;
  const isSelected = selectedToggle.getAttribute("aria-pressed") === "true";
  const isOtherSelected = otherToggle.getAttribute("aria-pressed") === "true";

  if (!isSelected) {
    selectedToggle.setAttribute("aria-pressed", "true");
    return;
  }

  if (isOtherSelected) {
    selectedToggle.setAttribute("aria-pressed", "false");
  }
}

function getSelectedStatuses(state) {
  if (state.statusAllToggle.getAttribute("aria-pressed") === "true") {
    return [...STATUS_FILTER_LABELS];
  }

  return state.statusToggles
    .filter((statusToggle) => statusToggle.getAttribute("aria-pressed") === "true")
    .map((statusToggle) => statusToggle.dataset.status)
    .filter(Boolean);
}

function renderNoWorkloadTypesSelected(state) {
  setStatusPill(state, "Empty", "muted");
  state.summaryGrid.replaceChildren(
    ...createEmptySummaryTiles(),
  );
  state.statusRegion.replaceChildren(
    createElement("div", {
      className: "sc-inline-status",
      text: "Selecione Booking ou Workloads para carregar oportunidades.",
    }),
  );
  renderEmptyRows(state, "Nenhum tipo selecionado.");
}

function renderNoSellersSelected(state) {
  setStatusPill(state, "Empty", "muted");
  state.summaryGrid.replaceChildren(
    ...createEmptySummaryTiles(),
  );
  state.statusRegion.replaceChildren(
    createElement("div", {
      className: "sc-inline-status",
      text: "Selecione ao menos um vendedor para exibir oportunidades.",
    }),
  );
  renderEmptyRows(state, "Nenhum vendedor selecionado.");
}

function renderNoTerritoriesSelected(state) {
  setStatusPill(state, "Empty", "muted");
  state.summaryGrid.replaceChildren(
    ...createEmptySummaryTiles(),
  );
  state.statusRegion.replaceChildren(
    createElement("div", {
      className: "sc-inline-status",
      text: "Selecione ao menos um território para carregar oportunidades.",
    }),
  );
  renderEmptyRows(state, "Nenhum território selecionado.");
}

function renderNoStatusesSelected(state) {
  setStatusPill(state, "Empty", "muted");
  state.summaryGrid.replaceChildren(
    ...createEmptySummaryTiles(),
  );
  state.statusRegion.replaceChildren(
    createElement("div", {
      className: "sc-inline-status",
      text: "Selecione ao menos um status para exibir oportunidades.",
    }),
  );
  renderEmptyRows(state, "Nenhum status selecionado.");
}

function renderDashboardData(state, data) {
  const items = Array.isArray(data?.items) ? data.items : [];
  state.currentData = data;
  state.currentDebug = data?.debug || null;
  state.tableState.allItems = items;
  state.tableState.expandedRows.clear();
  renderForecastActiveTerritoryOptions(state, data);
  renderRevenueRequestInspector(state, data?.debug);
  renderSellerFilterOptions(state, items);
  applyWorkloadTypeFilter(state);
}

function renderForecastActiveTerritoryOptions(state, data) {
  const options = Array.isArray(data?.forecastActiveOptions)
    ? data.forecastActiveOptions
    : [];

  if (!options.length) {
    state.availableTerritories = [];
    state.selectedTerritoryIds = new Set();
    state.territoryFilterList.replaceChildren(
      createElement("div", {
        className: "sc-multiselect-empty",
        text: "Nenhum território",
      }),
    );
    syncTerritoryFilterControls(state);
    return;
  }

  const availableTerritories = options.map((option) => ({
    territoryId: String(option.territoryId ?? "").trim(),
    territoryName: option.territoryName || "-",
  })).filter((option) => option.territoryId);
  const availableTerritoryIdSet = new Set(
    availableTerritories.map((territory) => territory.territoryId),
  );
  const previousSelectedTerritoryIds = Array.from(state.selectedTerritoryIds || [])
    .filter((territoryId) => availableTerritoryIdSet.has(territoryId));
  state.availableTerritories = availableTerritories;
  if (state.territorySelectionMode === "all") {
    state.selectedTerritoryIds = new Set(
      availableTerritories.map((territory) => territory.territoryId),
    );
  } else if (state.territorySelectionMode === "first") {
    state.selectedTerritoryIds = new Set(
      availableTerritories.slice(0, 1).map((territory) => territory.territoryId),
    );
    state.territorySelectionMode = "custom";
  } else {
    state.selectedTerritoryIds = new Set(previousSelectedTerritoryIds);
  }
  renderTerritoryFilterOptions(state);
  saveDashboardPreferences(state);
}

function applyWorkloadTypeFilter(state) {
  const items = Array.isArray(state.tableState.allItems)
    ? state.tableState.allItems
    : [];
  const selectedTypes = getSelectedWorkloadTypes(state);
  const selectedStatuses = getSelectedStatuses(state);

  if (selectedTypes.length === 0) {
    renderNoWorkloadTypesSelected(state);
    return;
  }

  if (state.availableTerritories.length > 0 && state.selectedTerritoryIds.size === 0) {
    renderNoTerritoriesSelected(state);
    return;
  }

  if (state.availableSellers.length > 0 && state.selectedSellers.size === 0) {
    renderNoSellersSelected(state);
    return;
  }

  if (selectedStatuses.length === 0) {
    renderNoStatusesSelected(state);
    return;
  }

  const filteredByType = filterItemsByWorkloadType(items, selectedTypes);
  const filteredBySeller = filterItemsBySeller(filteredByType, state.selectedSellers);
  const filteredItems = filterItemsByStatus(filteredBySeller, selectedStatuses);

  renderDashboardItems(state, filteredItems);
}

function filterItemsByWorkloadType(items, selectedTypes) {
  if (selectedTypes.length >= 2) {
    return items;
  }

  const selectedType = selectedTypes[0];

  return items.filter((item) => {
    const workloadType = String(findValueByAliases(item, ["workloadType"]) || "")
      .trim()
      .toUpperCase();
    return workloadType === selectedType;
  });
}

function filterItemsBySeller(items, selectedSellers) {
  if (!selectedSellers || selectedSellers.size === 0) {
    return [];
  }

  return items.filter((item) => selectedSellers.has(getSellerValue(item)));
}

function filterItemsByStatus(items, selectedStatuses) {
  if (selectedStatuses.length >= STATUS_FILTER_LABELS.length) {
    return items;
  }

  const selectedStatusSet = new Set(selectedStatuses);
  return items.filter((item) =>
    selectedStatusSet.has(getStatusTextByWinProbability(getRevenueWinProbability(item))),
  );
}

function renderDashboardItems(state, items) {
  setStatusPill(state, "Loaded", "success");
  state.summaryGrid.replaceChildren(
    ...createOpportunitySummaryTiles(items),
  );

  state.statusRegion.replaceChildren();

  if (items.length === 0) {
    renderEmptyRows(state, "Nenhuma oportunidade encontrada para os filtros selecionados.");
    return;
  }

  state.tableState.items = items;
  renderOpportunityRows(state.tableState, items);
}

function renderDashboardError(state, error) {
  setStatusPill(state, "Error", "danger");
  state.currentDebug = error?.debug || null;
  renderRevenueRequestInspector(state, error?.debug);
  state.summaryGrid.replaceChildren(
    ...createPlaceholderSummaryTiles("-"),
  );
  const retryButton = createElement("button", {
    attributes: { type: "button" },
    className: "sc-button",
    text: "Retry",
  });
  retryButton.addEventListener("click", () => loadCurrentQuarter(state));
  const errorMessage = error?.message || "Falha ao carregar dados do Sales Center.";

  state.statusRegion.replaceChildren(
    createElement("div", { className: "sc-error" }, [
      createElement("strong", {
        text: "Falha ao carregar dados do Sales Center.",
      }),
      createElement("span", {
        text: errorMessage,
      }),
      retryButton,
    ]),
  );
  renderEmptyRows(state, "Não foi possível carregar oportunidades.");
}

function clearRevenueRequestInspector(state) {
  if (!state.requestInspector) {
    return;
  }

  state.requestInspector.hidden = true;
  state.requestInspector.replaceChildren();
}

function renderRevenueRequestInspector(state, debug) {
  if (!state.requestInspector) {
    return;
  }

  if (state.debugToggle?.getAttribute("aria-pressed") !== "true") {
    clearRevenueRequestInspector(state);
    return;
  }

  const requests = Array.isArray(debug?.requests)
    ? debug.requests.filter((request) => getInspectableRequestLabel(request))
    : [];

  if (requests.length === 0) {
    if (debug?.cache) {
      renderCachedRequestInspector(state, debug.cache);
      return;
    }

    clearRevenueRequestInspector(state);
    return;
  }

  const header = createElement("div", { className: "sc-request-inspector-header" }, [
    createElement("div", {}, [
      createElement("strong", { text: "Requests executadas" }),
      createElement("span", {
        text: ` ${requests.length} request(s) executada(s)`,
      }),
    ]),
  ]);
  const requestList = createElement("div", { className: "sc-request-list" });

  requests.forEach((request, index) => {
    requestList.appendChild(createRevenueRequestDetails(request, index));
  });

  state.requestInspector.hidden = false;
  state.requestInspector.replaceChildren(header, requestList);
}

function renderCachedRequestInspector(state, cache) {
  const header = createElement("div", { className: "sc-request-inspector-header" }, [
    createElement("div", {}, [
      createElement("strong", { text: "Dados carregados do cache" }),
      createElement("span", {
        text: " nenhuma requisição HTTP foi executada nesta carga",
      }),
    ]),
  ]);
  const cacheDetails = createElement("div", { className: "sc-request-list" }, [
    createElement("details", {
      attributes: { open: "" },
      className: "sc-request-details",
    }, [
      createElement("summary", { className: "sc-request-summary" }, [
        createElement("span", {
          text: `Cache | ${cache.status || "hit"} | válido até ${formatInspectorDate(cache.expiresAt)}`,
        }),
      ]),
      createElement("div", { className: "sc-request-meta" }, [
        createRequestMetaItem("Status", cache.status || "hit"),
        createRequestMetaItem("Cached at", formatInspectorDate(cache.cachedAt)),
        createRequestMetaItem("Expires at", formatInspectorDate(cache.expiresAt)),
      ]),
      createRequestCodeBlock("Cache key", cache.key || "-"),
      createRequestCodeBlock(
        "Refresh",
        "Clique em Refresh para invalidar o cache e registrar novas requisições.",
      ),
    ]),
  ]);

  state.requestInspector.hidden = false;
  state.requestInspector.replaceChildren(header, cacheDetails);
}

function getInspectableRequestLabel(request) {
  const label = String(request?.label || "");
  const baseLabel = label.split(":")[0];

  return REQUEST_INSPECTOR_LABELS.includes(baseLabel) ? baseLabel : "";
}

function createRevenueRequestDetails(request, index) {
  const payload = request.body || null;
  const response = request.response || {};
  const offset = payload?.offset ?? "-";
  const baseLabel = getInspectableRequestLabel(request) || request.label || "-";
  const method = String(request.method || "GET").toUpperCase();
  const status = response.status
    ? `${response.status} ${response.statusText || ""}`.trim()
    : "sem response";
  const details = createElement("details", {
    className: "sc-request-details",
  });

  if (index === 0) {
    details.open = true;
  }

  details.appendChild(
    createElement("summary", { className: "sc-request-summary" }, [
      createElement("span", {
        text: `${baseLabel} | #${index + 1} | offset ${offset} | ${method} | ${status}`,
      }),
    ]),
  );

  const children = [
    createElement("div", { className: "sc-request-meta" }, [
      createRequestMetaItem("Label", request.label || "-"),
      createRequestMetaItem("Request", baseLabel),
      createRequestMetaItem("Method", method),
      createRequestMetaItem("Status", status),
      createRequestMetaItem("Payload offset", String(offset)),
      createRequestMetaItem("Payload limit", String(payload?.limit ?? "-")),
      createRequestMetaItem("Response size", `${response.bodySize ?? 0} chars`),
    ]),
    createRequestCodeBlock("URL", request.url || "-"),
  ];

  if (method === "POST") {
    children.push(createRequestCodeBlock("Payload enviado", stringifyForInspector(payload)));
  }

  children.push(createRequestCodeBlock("Response", formatResponsePreview(response.bodyPreview)));
  details.append(...children);

  return details;
}

function createRequestMetaItem(label, value) {
  return createElement("div", { className: "sc-request-meta-item" }, [
    createElement("span", { text: label }),
    createElement("strong", { text: value }),
  ]);
}

function createRequestCodeBlock(label, value) {
  return createElement("div", { className: "sc-request-code-group" }, [
    createElement("div", { className: "sc-request-code-label", text: label }),
    createElement("pre", { className: "sc-request-code", text: value || "-" }),
  ]);
}

function formatInspectorDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString("pt-BR");
}

function stringifyForInspector(value) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value, null, 2);
}

function formatResponsePreview(value) {
  if (!value) {
    return "-";
  }

  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch (error) {
    return String(value);
  }
}

function createSummaryTile(label, value, options = {}) {
  const valueElement = createElement("strong", {
    className: "sc-summary-value",
    text: value,
  });
  const tile = createElement("section", { className: "sc-summary-tile" }, [
    createElement("span", { className: "sc-summary-label", text: label }),
    valueElement,
  ]);

  if (Number.isFinite(options.countValue)) {
    animateSummaryValue(
      valueElement,
      options.countValue,
      options.formatter || numberFormatter,
    );
  }

  return tile;
}

function createPlaceholderSummaryTiles(value) {
  return [
    createSummaryTile("Opportunities", value),
    createSummaryTile("Total", value),
    ...STATUS_SUMMARY_LABELS.map((label) => createSummaryTile(toTitleCase(label), value)),
  ];
}

function createEmptySummaryTiles() {
  return [
    createSummaryTile("Opportunities", "0", {
      countValue: 0,
      formatter: numberFormatter,
    }),
    createSummaryTile("Total", currencyFormatter.format(0), {
      countValue: 0,
      formatter: currencyFormatter,
    }),
    ...STATUS_SUMMARY_LABELS.map((label) =>
      createSummaryTile(toTitleCase(label), currencyFormatter.format(0), {
        countValue: 0,
        formatter: currencyFormatter,
      }),
    ),
  ];
}

function createOpportunitySummaryTiles(items) {
  const valueByStatus = summarizeValueByStatus(items);
  const totalValue = STATUS_SUMMARY_LABELS.reduce(
    (total, label) => total + (valueByStatus[label] || 0),
    0,
  );

  return [
    createSummaryTile("Opportunities", numberFormatter.format(items.length), {
      countValue: items.length,
      formatter: numberFormatter,
    }),
    createSummaryTile("Total", currencyFormatter.format(totalValue), {
      countValue: totalValue,
      formatter: currencyFormatter,
    }),
    ...STATUS_SUMMARY_LABELS.map((label) =>
      createSummaryTile(
        toTitleCase(label),
        currencyFormatter.format(valueByStatus[label] || 0),
        {
          countValue: valueByStatus[label] || 0,
          formatter: currencyFormatter,
        },
      ),
    ),
  ];
}

function animateSummaryValue(element, targetValue, formatter) {
  const duration = 700;
  const startValue = 0;
  const endValue = Number(targetValue);

  if (
    !Number.isFinite(endValue) ||
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  ) {
    element.textContent = formatter.format(Math.round(endValue || 0));
    return;
  }

  const startedAt = performance.now();
  const renderFrame = (timestamp) => {
    const progress = Math.min((timestamp - startedAt) / duration, 1);
    const easedProgress = 1 - Math.pow(1 - progress, 3);
    const currentValue = startValue + ((endValue - startValue) * easedProgress);

    element.textContent = formatter.format(Math.round(currentValue));

    if (progress < 1) {
      window.requestAnimationFrame(renderFrame);
      return;
    }

    element.textContent = formatter.format(Math.round(endValue));
  };

  element.textContent = formatter.format(startValue);
  window.requestAnimationFrame(renderFrame);
}

function summarizeValueByStatus(items) {
  return items.reduce((summary, item) => {
    const status = getStatusTextByWinProbability(getRevenueWinProbability(item));

    if (!STATUS_SUMMARY_LABELS.includes(status)) {
      return summary;
    }

    summary[status] += getCalculatedValueAmount(item);
    return summary;
  }, STATUS_SUMMARY_LABELS.reduce((summary, label) => {
    summary[label] = 0;
    return summary;
  }, {}));
}

function getCalculatedValueAmount(item) {
  const workloadType = String(findValueByAliases(item, ["workloadType"]) || "")
    .trim()
    .toUpperCase();
  const value = workloadType === WORKLOAD_TYPE_WORKLOAD
    ? findValueByAliases(item, ["acr"])
    : findValueByAliases(item, ["revnRevenueAmount"]);

  return parseNumberValue(value);
}

function parseNumberValue(value) {
  if (value === undefined || value === null || value === "") {
    return 0;
  }

  const numberValue = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function toTitleCase(value) {
  const normalizedValue = String(value || "").toLowerCase();
  return normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1);
}
