"use strict";

function findSalesCenterCard(groupNode) {
  const navItem = groupNode.querySelector(`#${SALES_CENTER_CARD_ID}`);
  return navItem ? navItem.closest(".flat-grid-cell") : null;
}

function findAddIconCell(groupNode) {
  return Array.from(groupNode.children).find(
    (child) =>
      child.classList.contains("flat-grid-cell") &&
      child.classList.contains(SALES_CENTER_ADD_CELL_CLASS),
  );
}

function bindSalesCenterClick(card) {
  if (!card || clickBoundCards.has(card)) {
    return;
  }

  card.addEventListener(
    "click",
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      openSalesCenterDashboard();
    },
    true,
  );

  clickBoundCards.add(card);
}

function ensureSalesCenterCard() {
  if (!isFuseWelcomePage()) {
    return;
  }

  const groupNode = document.getElementById(SALES_CENTER_GROUP_ID);
  if (!groupNode) {
    return;
  }

  const addIconCell = findAddIconCell(groupNode);
  const card = findSalesCenterCard(groupNode) ?? createSalesCenterCard();

  bindSalesCenterClick(card);

  if (addIconCell && card.nextElementSibling !== addIconCell) {
    groupNode.insertBefore(card, addIconCell);
    return;
  }

  if (!card.parentElement) {
    groupNode.appendChild(card);
  }
}

if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type !== "salesCenter.loadingProgress") {
      return false;
    }

    handleLoadingProgressMessage(message.progress);
    return false;
  });
}

function handleLoadingProgressMessage(progress) {
  const state = activeDashboard?.state;

  if (!state || progress?.requestId !== state.topLoaderRequestId) {
    return;
  }

  updateTopLoadingProgress(state, progress.progress, {
    allowBackward: false,
    cap: 98,
  });
}

function openSalesCenterDashboard() {
  const existingOverlay = document.getElementById(SALES_CENTER_OVERLAY_ID);
  if (existingOverlay) {
    return;
  }

  const overlay = createElement("div", {
    attributes: {
      "aria-label": "Sales Center opportunities dashboard",
      "aria-modal": "true",
      id: SALES_CENTER_OVERLAY_ID,
      role: "dialog",
    },
    className: "sc-overlay",
  });
  const backdrop = createElement("div", { className: "sc-backdrop" });
  const panel = createElement("section", { className: "sc-panel" });
  overlay.append(backdrop, panel);
  document.body.appendChild(overlay);
  document.body.classList.add("sc-dashboard-open");

  const state = renderDashboardShell(panel);
  state.overlay = overlay;
  applyDashboardPreferences(state, loadDashboardPreferences());
  applyDashboardTheme(state, getSavedDashboardTheme());
  const handleFilterOutsideClick = (event) => {
    if (!state.sellerFilterRoot.contains(event.target)) {
      setSellerFilterExpanded(state, false);
    }
    if (!state.territoryFilterRoot.contains(event.target)) {
      setTerritoryFilterExpanded(state, false);
    }
    if (!state.columnFilterRoot.contains(event.target)) {
      setColumnFilterExpanded(state, false);
    }
  };
  const closeDashboard = () => {
    window.removeEventListener("keydown", handleDashboardKeydown, true);
    document.removeEventListener("click", handleFilterOutsideClick);
    stopTopLoadingTimer(state);
    overlay.remove();
    document.body.classList.remove("sc-dashboard-open");
    activeDashboard = null;
  };
  const handleDashboardKeydown = (event) => {
    if (event.key === "Escape") {
      closeDashboard();
      return;
    }

    const isDebugShortcut =
      event.ctrlKey &&
      event.altKey &&
      (
        String(event.key || "").toLowerCase() === "d" ||
        event.code === "KeyD"
      );

    if (isDebugShortcut) {
      event.preventDefault();
      event.stopPropagation();
      toggleDebugButtonVisibility(state);
    }
  };

  activeDashboard = { close: closeDashboard, state };
  state.closeButton.addEventListener("click", closeDashboard);
  state.themeToggleButton.addEventListener("click", () => {
    const nextTheme = state.overlay.classList.contains("sc-theme-dark")
      ? "light"
      : "dark";
    applyDashboardTheme(state, nextTheme);
    saveDashboardTheme(nextTheme);
  });
  backdrop.addEventListener("click", closeDashboard);
  window.addEventListener("keydown", handleDashboardKeydown, true);
  document.addEventListener("click", handleFilterOutsideClick);

  state.periodSelect.addEventListener("change", () => {
    saveDashboardPreferences(state);
    if (isLoadableSalesCenterPeriod(state.periodSelect.value)) {
      loadCurrentQuarter(state);
      return;
    }

    renderComingSoon(state, state.periodSelect.value);
  });
  state.territoryFilterButton.addEventListener("click", () => {
    const isExpanded = state.territoryFilterButton.getAttribute("aria-expanded") === "true";
    setTerritoryFilterExpanded(state, !isExpanded);
  });
  state.territoryFilterPanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  state.territoryAllButton.addEventListener("click", () => {
    state.territorySelectionMode = "all";
    state.selectedTerritoryIds = new Set(
      state.availableTerritories.map((territory) => territory.territoryId),
    );
    syncTerritoryFilterControls(state);
    saveDashboardPreferences(state);
    handleTerritorySelectionChanged(state);
  });
  state.territoryNoneButton.addEventListener("click", () => {
    state.territorySelectionMode = "custom";
    state.selectedTerritoryIds = new Set();
    syncTerritoryFilterControls(state);
    saveDashboardPreferences(state);
    handleTerritorySelectionChanged(state);
  });
  state.refreshButton.addEventListener("click", () => {
    if (isLoadableSalesCenterPeriod(state.periodSelect.value)) {
      loadCurrentQuarter(state, { forceRefresh: true });
    }
  });
  state.bookingToggle.addEventListener("click", () => {
    toggleWorkloadTypeFilterSelection(state, WORKLOAD_TYPE_BOOKING);
    saveDashboardPreferences(state);
    if (isLoadableSalesCenterPeriod(state.periodSelect.value)) {
      applyWorkloadTypeFilter(state);
    }
  });
  state.workloadsToggle.addEventListener("click", () => {
    toggleWorkloadTypeFilterSelection(state, WORKLOAD_TYPE_WORKLOAD);
    saveDashboardPreferences(state);
    if (isLoadableSalesCenterPeriod(state.periodSelect.value)) {
      applyWorkloadTypeFilter(state);
    }
  });
  state.statusAllToggle.addEventListener("click", () => {
    setStatusFilterAllSelected(state);
    saveDashboardPreferences(state);
    if (isLoadableSalesCenterPeriod(state.periodSelect.value)) {
      applyWorkloadTypeFilter(state);
    }
  });
  for (const statusToggle of state.statusToggles) {
    statusToggle.addEventListener("click", () => {
      toggleStatusFilterSelection(state, statusToggle.dataset.status);
      saveDashboardPreferences(state);
      if (isLoadableSalesCenterPeriod(state.periodSelect.value)) {
        applyWorkloadTypeFilter(state);
      }
    });
  }
  state.sellerFilterButton.addEventListener("click", () => {
    const isExpanded = state.sellerFilterButton.getAttribute("aria-expanded") === "true";
    setSellerFilterExpanded(state, !isExpanded);
  });
  state.sellerFilterPanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  state.columnFilterButton.addEventListener("click", () => {
    const isExpanded = state.columnFilterButton.getAttribute("aria-expanded") === "true";
    setColumnFilterExpanded(state, !isExpanded);
  });
  state.columnFilterPanel.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  state.columnAllButton.addEventListener("click", () => {
    state.tableState.visibleColumnKeys = new Set(DEFAULT_VISIBLE_COLUMN_KEYS);
    syncColumnFilterControls(state);
    handleColumnVisibilityChanged(state);
  });
  state.columnNoneButton.addEventListener("click", () => {
    state.tableState.visibleColumnKeys = new Set(["opportunity"]);
    syncColumnFilterControls(state);
    handleColumnVisibilityChanged(state);
  });
  state.sellerAllButton.addEventListener("click", () => {
    state.sellerSelectionMode = "all";
    state.selectedSellers = new Set(state.availableSellers);
    syncSellerFilterControls(state);
    saveDashboardPreferences(state);
    if (isLoadableSalesCenterPeriod(state.periodSelect.value)) {
      applyWorkloadTypeFilter(state);
    }
  });
  state.sellerNoneButton.addEventListener("click", () => {
    state.sellerSelectionMode = "custom";
    state.selectedSellers = new Set();
    syncSellerFilterControls(state);
    saveDashboardPreferences(state);
    if (isLoadableSalesCenterPeriod(state.periodSelect.value)) {
      applyWorkloadTypeFilter(state);
    }
  });
  state.debugToggle.addEventListener("click", () => {
    togglePressedState(state.debugToggle);
    renderRevenueRequestInspector(state, state.currentDebug);
  });

  loadCurrentQuarter(state);
}
