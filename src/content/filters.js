"use strict";

function createToggleButton(label, pressed, tone, dataset = {}) {
  return createElement("button", {
    attributes: {
      "aria-pressed": String(pressed),
      type: "button",
    },
    className: `sc-toggle-button sc-toggle-button-${tone}`,
    dataset,
    text: label,
  });
}

function togglePressedState(button) {
  const nextPressed = button.getAttribute("aria-pressed") !== "true";
  button.setAttribute("aria-pressed", String(nextPressed));
}

function toggleDebugButtonVisibility(state) {
  state.debugToggle.hidden = !state.debugToggle.hidden;

  if (state.debugToggle.hidden) {
    state.debugToggle.setAttribute("aria-pressed", "false");
    clearRevenueRequestInspector(state);
  }
}

function applyDashboardPreferences(state, preferences) {
  const normalizedPreferences = normalizeDashboardPreferences(preferences);
  state.preferences = normalizedPreferences;
  state.periodSelect.value = normalizedPreferences.period;
  state.sellerSelectionMode = normalizedPreferences.sellerMode;
  state.territorySelectionMode = normalizedPreferences.territoryMode;
  state.selectedSellers = new Set(normalizedPreferences.sellers);
  state.selectedTerritoryIds = new Set(normalizedPreferences.territoryIds);
  state.tableState.visibleColumnKeys = new Set(normalizedPreferences.visibleColumnKeys);
  applyWorkloadTypePreferences(state, normalizedPreferences.workloadTypes);
  applyStatusPreferences(state, normalizedPreferences);
  renderColumnFilterOptions(state);
  renderTableHeader(state.tableState);
}

function applyWorkloadTypePreferences(state, workloadTypes) {
  const selectedTypes = new Set(workloadTypes);
  state.bookingToggle.setAttribute(
    "aria-pressed",
    String(selectedTypes.has(WORKLOAD_TYPE_BOOKING)),
  );
  state.workloadsToggle.setAttribute(
    "aria-pressed",
    String(selectedTypes.has(WORKLOAD_TYPE_WORKLOAD)),
  );

  if (getSelectedWorkloadTypes(state).length === 0) {
    state.bookingToggle.setAttribute("aria-pressed", "true");
    state.workloadsToggle.setAttribute("aria-pressed", "true");
  }
}

function applyStatusPreferences(state, preferences) {
  const selectedStatuses = new Set(preferences.statuses);
  const isAllSelected =
    preferences.statusMode === "all" ||
    STATUS_FILTER_LABELS.every((status) => selectedStatuses.has(status));

  state.statusAllToggle.setAttribute("aria-pressed", String(isAllSelected));

  for (const statusToggle of state.statusToggles) {
    statusToggle.setAttribute(
      "aria-pressed",
      String(isAllSelected || selectedStatuses.has(statusToggle.dataset.status)),
    );
  }
}

function startTopLoading(state) {
  stopTopLoadingTimer(state);
  state.topLoaderProgress = 4;
  state.topLoader.classList.add("sc-top-loader-active");
  state.topLoader.classList.remove("sc-top-loader-complete");
  updateTopLoadingProgress(state, state.topLoaderProgress);
}

function completeTopLoading(state) {
  const completedRequestId = state.topLoaderRequestId;
  stopTopLoadingTimer(state);
  updateTopLoadingProgress(state, 100, { allowBackward: true });
  state.topLoader.classList.add("sc-top-loader-complete");
  window.setTimeout(() => {
    if (state.topLoaderRequestId !== completedRequestId) {
      return;
    }

    state.topLoader.classList.remove("sc-top-loader-active", "sc-top-loader-complete");
    window.setTimeout(() => {
      if (state.topLoaderRequestId !== completedRequestId) {
        return;
      }

      updateTopLoadingProgress(state, 0, { allowBackward: true });
    }, 140);
  }, 260);
}

function stopTopLoadingTimer(state) {
  if (!state.topLoaderTimer) {
    return;
  }

  window.clearInterval(state.topLoaderTimer);
  state.topLoaderTimer = null;
}

function updateTopLoadingProgress(state, progress, options = {}) {
  const cap = options.cap ?? 100;
  const normalizedProgress = Math.max(0, Math.min(Number(progress) || 0, cap));
  const nextProgress = options.allowBackward === false
    ? Math.max(state.topLoaderProgress || 0, normalizedProgress)
    : normalizedProgress;

  state.topLoaderProgress = nextProgress;
  state.topLoaderBar.style.transform = `scaleX(${Math.min(nextProgress, 100) / 100})`;
}

function setSellerFilterExpanded(state, expanded) {
  state.sellerFilterButton.setAttribute("aria-expanded", String(expanded));
  state.sellerFilterPanel.hidden = !expanded;
}

function setTerritoryFilterExpanded(state, expanded) {
  state.territoryFilterButton.setAttribute("aria-expanded", String(expanded));
  state.territoryFilterPanel.hidden = !expanded;
}

function setColumnFilterExpanded(state, expanded) {
  state.columnFilterButton.setAttribute("aria-expanded", String(expanded));
  state.columnFilterPanel.hidden = !expanded;
}

function renderColumnFilterOptions(state) {
  state.columnFilterList.replaceChildren();
  const fragment = document.createDocumentFragment();

  for (const column of SELECTABLE_TABLE_COLUMNS) {
    const input = createElement("input", {
      attributes: {
        checked: "",
        type: "checkbox",
        value: column.key,
      },
      className: "sc-checkbox-input",
    });
    input.addEventListener("change", () => {
      if (input.checked) {
        state.tableState.visibleColumnKeys.add(column.key);
      } else {
        state.tableState.visibleColumnKeys.delete(column.key);
      }

      if (state.tableState.visibleColumnKeys.size === 0) {
        state.tableState.visibleColumnKeys.add("opportunity");
      }

      syncColumnFilterControls(state);
      handleColumnVisibilityChanged(state);
    });

    fragment.appendChild(
      createElement("label", { className: "sc-checkbox-row" }, [
        input,
        createElement("span", { text: column.label || column.key }),
      ]),
    );
  }

  state.columnFilterList.appendChild(fragment);
  syncColumnFilterControls(state);
}

function syncColumnFilterControls(state) {
  for (const input of state.columnFilterList.querySelectorAll("input[type='checkbox']")) {
    input.checked = state.tableState.visibleColumnKeys.has(input.value);
  }

  updateColumnFilterButtonLabel(state);
}

function updateColumnFilterButtonLabel(state) {
  const selectedCount = state.tableState.visibleColumnKeys.size;
  const totalCount = SELECTABLE_TABLE_COLUMNS.length;
  const label = selectedCount === totalCount
    ? "Selecionar colunas da tabela: todas"
    : `Selecionar colunas da tabela: ${selectedCount} de ${totalCount}`;

  state.columnFilterButton.setAttribute("aria-label", label);
  state.columnFilterButton.setAttribute("title", label);
}

function handleColumnVisibilityChanged(state) {
  saveDashboardPreferences(state);
  renderTableHeader(state.tableState);

  if (state.tableState.items.length > 0) {
    renderOpportunityRows(state.tableState, state.tableState.items);
    return;
  }

  renderEmptyRows(state, "Nenhuma oportunidade encontrada para os filtros selecionados.");
}

function renderTerritoryFilterOptions(state) {
  state.territoryFilterList.replaceChildren();

  if (state.availableTerritories.length === 0) {
    state.territoryFilterList.appendChild(
      createElement("div", {
        className: "sc-multiselect-empty",
        text: "Nenhum territÃ³rio",
      }),
    );
    syncTerritoryFilterControls(state);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const territory of state.availableTerritories) {
    const input = createElement("input", {
      attributes: {
        checked: "",
        type: "checkbox",
        value: territory.territoryId,
      },
      className: "sc-checkbox-input",
    });
    input.addEventListener("change", () => {
      state.territorySelectionMode = "custom";
      if (input.checked) {
        state.selectedTerritoryIds.add(territory.territoryId);
      } else {
        state.selectedTerritoryIds.delete(territory.territoryId);
      }

      syncTerritoryFilterControls(state);
      saveDashboardPreferences(state);
      handleTerritorySelectionChanged(state);
    });

    fragment.appendChild(
      createElement("label", { className: "sc-checkbox-row" }, [
        input,
        createElement("span", { text: territory.territoryName }),
      ]),
    );
  }

  state.territoryFilterList.appendChild(fragment);
  syncTerritoryFilterControls(state);
}

function syncTerritoryFilterControls(state) {
  for (const input of state.territoryFilterList.querySelectorAll("input[type='checkbox']")) {
    input.checked = state.selectedTerritoryIds.has(input.value);
  }

  updateTerritoryFilterButtonLabel(state);
}

function updateTerritoryFilterButtonLabel(state) {
  const selectedCount = state.selectedTerritoryIds.size;
  const totalCount = state.availableTerritories.length;
  const selectedTerritories = getSelectedTerritoryNames(state);

  state.territoryFilterButton.removeAttribute("title");

  if (totalCount === 0) {
    state.territoryFilterButton.textContent = "TerritÃ³rio: Carregando";
    state.territoryFilterButton.setAttribute("aria-label", "Filtro de territÃ³rio carregando");
    return;
  }

  if (selectedCount === 0) {
    state.territoryFilterButton.textContent = "TerritÃ³rio: Nenhum";
    state.territoryFilterButton.setAttribute("aria-label", "Filtro de territÃ³rio: nenhum");
    return;
  }

  if (selectedCount === 1) {
    const territoryName = selectedTerritories[0] || "-";
    state.territoryFilterButton.textContent = `TerritÃ³rio: ${territoryName}`;
    state.territoryFilterButton.setAttribute(
      "aria-label",
      `Filtro de territÃ³rio: ${territoryName}`,
    );
    return;
  }

  state.territoryFilterButton.textContent =
    selectedCount === totalCount ? "TerritÃ³rio: Todos" : `TerritÃ³rio: ${selectedCount}`;
  state.territoryFilterButton.setAttribute(
    "aria-label",
    `Filtro de territÃ³rio: ${selectedCount} selecionados`,
  );
  state.territoryFilterButton.setAttribute("title", selectedTerritories.join("\n"));
}

function getSelectedTerritoryNames(state) {
  return state.availableTerritories
    .filter((territory) => state.selectedTerritoryIds.has(territory.territoryId))
    .map((territory) => territory.territoryName || "-");
}

function handleTerritorySelectionChanged(state) {
  if (!isLoadableSalesCenterPeriod(state.periodSelect.value)) {
    return;
  }

  if (state.availableTerritories.length > 0 && state.selectedTerritoryIds.size === 0) {
    renderNoTerritoriesSelected(state);
    return;
  }

  loadCurrentQuarter(state);
}

function renderSellerFilterOptions(state, items) {
  const sellers = collectSellerOptions(items);
  const availableSellerSet = new Set(sellers);
  const previousSelectedSellers = Array.from(state.selectedSellers || [])
    .filter((seller) => availableSellerSet.has(seller));

  state.availableSellers = sellers;
  state.selectedSellers = state.sellerSelectionMode === "all"
    ? new Set(sellers)
    : new Set(previousSelectedSellers);
  state.sellerFilterList.replaceChildren();

  if (sellers.length === 0) {
    state.sellerFilterList.appendChild(
      createElement("div", {
        className: "sc-multiselect-empty",
        text: "Nenhum vendedor",
      }),
    );
    syncSellerFilterControls(state);
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const seller of sellers) {
    const input = createElement("input", {
      attributes: {
        checked: "",
        type: "checkbox",
        value: seller,
      },
      className: "sc-checkbox-input",
    });
    input.addEventListener("change", () => {
      state.sellerSelectionMode = "custom";
      if (input.checked) {
        state.selectedSellers.add(seller);
      } else {
        state.selectedSellers.delete(seller);
      }

      syncSellerFilterControls(state);
      saveDashboardPreferences(state);
      if (isLoadableSalesCenterPeriod(state.periodSelect.value)) {
        applyWorkloadTypeFilter(state);
      }
    });

    fragment.appendChild(
      createElement("label", { className: "sc-checkbox-row" }, [
        input,
        createElement("span", { text: seller }),
      ]),
    );
  }

  state.sellerFilterList.appendChild(fragment);
  syncSellerFilterControls(state);
}

function collectSellerOptions(items) {
  return Array.from(new Set(items.map(getSellerValue)))
    .filter(Boolean)
    .sort((sellerA, sellerB) =>
      sellerA.localeCompare(sellerB, "pt-BR", {
        numeric: true,
        sensitivity: "base",
      }),
    );
}

function getSellerValue(item) {
  const seller = findValueByAliases(item, SELLER_ALIASES);
  const normalizedSeller = seller === null || seller === undefined
    ? ""
    : String(seller).trim();

  return normalizedSeller || "Sem vendedor";
}

function syncSellerFilterControls(state) {
  for (const input of state.sellerFilterList.querySelectorAll("input[type='checkbox']")) {
    input.checked = state.selectedSellers.has(input.value);
  }

  updateSellerFilterButtonLabel(state);
}

function updateSellerFilterButtonLabel(state) {
  const selectedCount = state.selectedSellers.size;
  const totalCount = state.availableSellers.length;
  const selectedSellers = getSelectedSellerNames(state);

  state.sellerFilterButton.removeAttribute("title");

  if (totalCount === 0) {
    state.sellerFilterButton.textContent = "Vendedor: Todos";
    state.sellerFilterButton.setAttribute("aria-label", "Filtro de vendedor: todos");
    return;
  }

  if (selectedCount === 0) {
    state.sellerFilterButton.textContent = "Vendedor: Nenhum";
    state.sellerFilterButton.setAttribute("aria-label", "Filtro de vendedor: nenhum");
    return;
  }

  if (selectedCount === 1) {
    const seller = selectedSellers[0] || "";
    const shortName = formatSellerShortName(seller);
    state.sellerFilterButton.textContent = `Vendedor: ${shortName}`;
    state.sellerFilterButton.setAttribute("aria-label", `Filtro de vendedor: ${seller}`);
    return;
  }

  state.sellerFilterButton.textContent =
    selectedCount === totalCount ? "Vendedor: Todos" : `Vendedor: ${selectedCount}`;
  state.sellerFilterButton.setAttribute(
    "aria-label",
    `Filtro de vendedor: ${selectedCount} selecionados`,
  );
  state.sellerFilterButton.setAttribute("title", selectedSellers.join("\n"));
}

function getSelectedSellerNames(state) {
  return state.availableSellers.filter((seller) => state.selectedSellers.has(seller));
}

function formatSellerShortName(seller) {
  const normalizedSeller = String(seller || "").trim();

  if (!normalizedSeller) {
    return "Sem vendedor";
  }

  if (normalizedSeller === "Sem vendedor") {
    return normalizedSeller;
  }

  const displaySource = normalizedSeller.includes("@")
    ? normalizedSeller.split("@")[0].replace(/[._-]+/g, " ")
    : normalizedSeller;
  const nameParts = displaySource
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length <= 1) {
    return normalizedSeller;
  }

  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];

  return `${firstName} ${lastName}`;
}
