"use strict";

const SALES_CENTER_GROUP_ID = "yourapps_groupNode_sales";
const SALES_CENTER_ADD_CELL_CLASS = "flat-grid-cell-addicon";
const SALES_CENTER_CARD_ID = "c_5c719a88b5624b1eaf81defe2c2er3t6";
const SALES_CENTER_ORIGIN_URL =
  "https://eeho.fa.us2.oraclecloud.com/hcmUI/faces/FuseWelcome";
const SALES_CENTER_OVERLAY_ID = "sales-center-dashboard-overlay";
const SALES_CENTER_THEME_STORAGE_KEY = "salesCenterDashboardTheme";
const SALES_CENTER_PREFERENCES_STORAGE_KEY = "salesCenterDashboardPreferences";
const SALES_CENTER_CURRENT_QUARTER = "Current Quarter";
const SALES_CENTER_NEXT_QUARTER = "Next Quarter";
const SALES_CENTER_PREVIOUS_QUARTER = "Previous Quarter";
const SALES_CENTER_CURRENT_FISCAL_YEAR = "Current Fiscal Year";
const SALES_CENTER_ROLLING_QUARTERS = "4 Rolling Quarters (CQ + 3)";
const SALES_CENTER_RENEWALS = "RENEWALS (Current + Past Due)";
const SALES_CLOUD_REFERER =
  "https://gxpap-e.oracle.com/oalcrm/web/SalesCloudSMC-GEC/";
const OPPORTUNITY_DETAIL_BASE_URL =
  "https://eeho.fa.us2.oraclecloud.com/fscmUI/redwood/cx-sales/application/container/opportunities/opportunities-detail";
const WORKLOAD_DETAIL_BASE_URL =
  "https://spa.oracle.com/oalcrm/web/api/g2m-consumer-application/ui/index.html?ojr=workload_workbench%2Fworkload_details%3BcomponentContext%3D%255B%257B%2522key%2522%253A%2522sampleKey%2522%252C%2522value%2522%253A%2522sampleValue%2522%257D%255D%3BworkloadId%3D";

const SALES_CENTER_PERIODS = [
  SALES_CENTER_CURRENT_QUARTER,
  SALES_CENTER_NEXT_QUARTER,
  SALES_CENTER_PREVIOUS_QUARTER,
  SALES_CENTER_CURRENT_FISCAL_YEAR,
  SALES_CENTER_ROLLING_QUARTERS,
  SALES_CENTER_RENEWALS,
];
const SELLER_ALIASES = [
  "ownerName",
  "salesperson",
  "salesPerson",
  "salesRep",
  "salesRepName",
  "salesResourceName",
  "resourceName",
  "resourceFullName",
  "owner",
  "ownerFullName",
  "forecastAs",
];
const WORKLOAD_TYPE_BOOKING = "B";
const WORKLOAD_TYPE_WORKLOAD = "W";
const STATUS_SUMMARY_LABELS = ["WON", "FORECAST", "UPSIDE", "PIPELINE", "LEAD"];
const STATUS_FILTER_LABELS = STATUS_SUMMARY_LABELS;
const REQUEST_INSPECTOR_LABELS = [
  "requestForecastActive",
  "requestNextQuarter",
  "requestPreviousQuarter",
  "requestFullYearForecast",
  "requestRollingYearForecastHeader",
  "requestRevenueItems",
];

const SALES_CENTER_TILE_HTML = `
<div class="flat-grid-cell"><div id="c_5c719a88b5624b1eaf81defe2c2er3t6" class="app-nav-item" filmstrip="Sales Center" page="undefined" index="0" type="subcluster" title="Sales Center" group="groupNode_tools" destinationurl="https://gxpap.oracle.com/ords/pgxpap/f?p=138" targetframe="_blank" isdesturlexist="true" role="presentation"><svg viewBox="0 0 48 48" style="fill:currentColor" class="svg-nav suiicon svg-bkgd09" data-icon="navi_reportsearch" role="presentation" focusable="false"><path class="svg-shortcut" d="M28 42.5l-3 2.7v-1.7c-.4 0-1.4 0-2.5.6-1.3 1-1.5 1.6-1.5 1.6s-.4-1.2.8-2.7c1.2-1.6 2.6-1.7 3.2-1.6v-1.6l3 2.7z"></path><path class="svg-cluster" d="M28.5 41.3c.6 0 1.2.5 1.2 1.2s-.6 1.2-1.2 1.2-1.2-.5-1.2-1.2.5-1.2 1.2-1.2zm-4 0c.6 0 1.2.5 1.2 1.2s-.6 1.2-1.2 1.2c-.7 0-1.2-.5-1.2-1.2s.5-1.2 1.2-1.2zm-4 0c.7 0 1.2.5 1.2 1.2s-.5 1.2-1.2 1.2-1.2-.5-1.2-1.2.5-1.2 1.2-1.2z"></path><path class="svg-icon15" d="M16 31l-1.6-1-3.4 6.5s0 1 .5 1.4c.5.2 1.4-.4 1.4-.4l3-6.7z"></path><path class="svg-icon03" d="M36 10H12c-.8 0-2 1.2-2 2v20c0 .4.2.8.5 1l2-3.6c-1-1.4-1.6-3-1.6-5 0-4.2 3.3-7.6 7.4-7.6H20V16h2v1.7c.7.4 1.3 1 1.8 1.5.6.5 1 1 1.3 1.8h4v7h-4c-.3.7-.8 1.4-1.4 2H35v2H20.3l-2 .2H18L17 34h19c.8 0 2-1.2 2-2V12c0-.8-1.2-2-2-2zm-23 4v-2h22v2H13zm22 14h-5V17h5v11z"></path><path class="svg-icon12" d="M18.5 19c-3 0-5.5 2.5-5.5 5.5s2.5 5.5 5.5 5.5 5.5-2.5 5.5-5.5-2.5-5.5-5.5-5.5zm0 9c-2 0-3.5-1.6-3.5-3.5 0-2 1.6-3.5 3.5-3.5s3.5 1.6 3.5 3.5c0 2-1.6 3.5-3.5 3.5z"></path><path class="svg-outline" d="M35 34.56H13a2.7 2.7 0 0 1-3-3V14a2.76 2.76 0 0 1 3-3h22a2.74 2.74 0 0 1 3 3v17.56a2.68 2.68 0 0 1-3 3zM16.98 22.32a4.72 4.72 0 1 0 4.73 4.73 4.72 4.72 0 0 0-4.73-4.73zM24 25h3.47v4.72H24V25zm5.78-4.66h4.69v9.38h-4.69v-9.38zM13.5 14.5h20.9v2.4H13.5v-2.4zm6.9 17.59l-.01-1.94zm-2.04-12.75l-5.35-.02zm2.13 12.67H35.7zm-.09-8.05L20.39 19z"></path><path class="svg-outline" d="M16.98 31.72a4.68 4.68 0 1 0-4.75-4.67 4.74 4.74 0 0 0 4.75 4.67zm-1.44-.5l-3.6 6.83zM8 40"></path></svg><a id="c_5c719a88b5624b1eaf81defe2c2ee4d5_0" class="app-nav-label flat-grid-nav-label" href="#">Sales Center</a></div></div>
`.trim();

const TABLE_COLUMNS = [
  {
    key: "opportunity",
    label: "OPORTUNIDADE",
    aliases: [
      "opportunityName",
      "opportunity",
      "optyName",
      "optyNumber",
      "optyId",
      "opportunityNumber",
      "dealName",
      "name",
    ],
  },
  {
    key: "seller",
    label: "VENDEDOR",
    aliases: SELLER_ALIASES,
  },
  {
    key: "type",
    label: "TYPE",
    aliases: ["workloadType"],
  },
  {
    key: "status",
    label: "STATUS",
    aliases: ["revnWinProbability"],
    type: "status",
  },
  {
    key: "risk",
    label: "RISCO",
    aliases: ["dealRiskLevel", "risk", "riskCategory", "dealRisk", "riskLevel", "riskCode"],
  },
  {
    key: "probability",
    label: "PROB.",
    aliases: ["optyWinProb"],
    type: "percent",
  },
  {
    key: "stage",
    label: "ESTÁGIO",
    aliases: ["salesStage", "salesStageName", "stage", "stageName"],
  },
  {
    key: "closeDate",
    label: "Close date",
    aliases: ["revnEffectiveDate"],
    type: "date",
  },
  {
    key: "fiscalWeek",
    label: "FY Week",
    aliases: ["revnEffectiveDate"],
    type: "fiscalWeek",
  },
  {
    key: "currency",
    label: "Currency",
    aliases: ["crmCurrCode"],
  },
  {
    key: "value",
    label: "Valor",
    aliases: ["revnRevenueAmount", "acr"],
    type: "number",
  },
  {
    key: "channel",
    label: "CANAL",
    aliases: [
      "salesChannel",
      "salesChannelName",
      "channel",
      "channelName",
      "routeToMarket",
      "partnerName",
    ],
  },
  {
    key: "details",
    label: "",
    sortable: false,
  },
];
const SELECTABLE_TABLE_COLUMNS = TABLE_COLUMNS.filter((column) => column.key !== "details");
const DEFAULT_VISIBLE_COLUMN_KEYS = SELECTABLE_TABLE_COLUMNS.map((column) => column.key);

const clickBoundCards = new WeakSet();
const currencyFormatter = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});
const numberFormatter = new Intl.NumberFormat("en-US");

let activeDashboard = null;

function isFuseWelcomePage() {
  return window.location.href.startsWith(SALES_CENTER_ORIGIN_URL);
}

function createSalesCenterCard() {
  const template = document.createElement("template");
  template.innerHTML = SALES_CENTER_TILE_HTML;
  return template.content.firstElementChild;
}

function createElement(tagName, options = {}, children = []) {
  const element = document.createElement(tagName);

  if (options.className) {
    element.className = options.className;
  }

  if (options.text !== undefined) {
    element.textContent = options.text;
  }

  if (options.attributes) {
    for (const [name, value] of Object.entries(options.attributes)) {
      element.setAttribute(name, value);
    }
  }

  if (options.dataset) {
    for (const [name, value] of Object.entries(options.dataset)) {
      element.dataset[name] = value;
    }
  }

  for (const child of children) {
    element.appendChild(child);
  }

  return element;
}

function createSvgElement(tagName, attributes = {}, children = []) {
  const element = document.createElementNS("http://www.w3.org/2000/svg", tagName);

  for (const [name, value] of Object.entries(attributes)) {
    element.setAttribute(name, value);
  }

  for (const child of children) {
    element.appendChild(child);
  }

  return element;
}

function createThemeToggleIcons() {
  const iconAttributes = {
    "aria-hidden": "true",
    fill: "none",
    height: "18",
    stroke: "currentColor",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "stroke-width": "2",
    viewBox: "0 0 24 24",
    width: "18",
  };

  return [
    createSvgElement("svg", {
      ...iconAttributes,
      class: "sc-theme-icon sc-theme-icon-moon",
    }, [
      createSvgElement("path", {
        d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z",
      }),
    ]),
    createSvgElement("svg", {
      ...iconAttributes,
      class: "sc-theme-icon sc-theme-icon-sun",
    }, [
      createSvgElement("circle", { cx: "12", cy: "12", r: "4" }),
      createSvgElement("line", { x1: "12", x2: "12", y1: "2", y2: "4" }),
      createSvgElement("line", { x1: "12", x2: "12", y1: "20", y2: "22" }),
      createSvgElement("line", { x1: "4.93", x2: "6.34", y1: "4.93", y2: "6.34" }),
      createSvgElement("line", { x1: "17.66", x2: "19.07", y1: "17.66", y2: "19.07" }),
      createSvgElement("line", { x1: "2", x2: "4", y1: "12", y2: "12" }),
      createSvgElement("line", { x1: "20", x2: "22", y1: "12", y2: "12" }),
      createSvgElement("line", { x1: "4.93", x2: "6.34", y1: "19.07", y2: "17.66" }),
      createSvgElement("line", { x1: "17.66", x2: "19.07", y1: "6.34", y2: "4.93" }),
    ]),
  ];
}

function createTableColumnsIcon() {
  return createSvgElement("svg", {
    "aria-hidden": "true",
    class: "sc-table-columns-icon",
    fill: "none",
    height: "18",
    stroke: "currentColor",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
    "stroke-width": "2",
    viewBox: "0 0 24 24",
    width: "18",
  }, [
    createSvgElement("rect", { height: "14", rx: "2", width: "18", x: "3", y: "5" }),
    createSvgElement("line", { x1: "9", x2: "9", y1: "5", y2: "19" }),
    createSvgElement("line", { x1: "15", x2: "15", y1: "5", y2: "19" }),
  ]);
}

function getSavedDashboardTheme() {
  try {
    return localStorage.getItem(SALES_CENTER_THEME_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch (error) {
    return "light";
  }
}

function saveDashboardTheme(theme) {
  try {
    localStorage.setItem(SALES_CENTER_THEME_STORAGE_KEY, theme);
  } catch (error) {
    return;
  }
}

function getDefaultDashboardPreferences() {
  return {
    period: SALES_CENTER_CURRENT_QUARTER,
    sellerMode: "all",
    sellers: [],
    statusMode: "all",
    statuses: [...STATUS_FILTER_LABELS],
    territoryIds: [],
    territoryMode: "first",
    visibleColumnKeys: [...DEFAULT_VISIBLE_COLUMN_KEYS],
    workloadTypes: [WORKLOAD_TYPE_BOOKING, WORKLOAD_TYPE_WORKLOAD],
  };
}

function loadDashboardPreferences() {
  const defaults = getDefaultDashboardPreferences();

  try {
    const rawPreferences = localStorage.getItem(SALES_CENTER_PREFERENCES_STORAGE_KEY);
    if (!rawPreferences) {
      return defaults;
    }

    const parsedPreferences = JSON.parse(rawPreferences);
    if (!parsedPreferences || typeof parsedPreferences !== "object") {
      return defaults;
    }

    return normalizeDashboardPreferences({
      ...defaults,
      ...parsedPreferences,
    });
  } catch (error) {
    return defaults;
  }
}

function normalizeDashboardPreferences(preferences) {
  const validPeriods = new Set(SALES_CENTER_PERIODS);
  const validWorkloadTypes = new Set([WORKLOAD_TYPE_BOOKING, WORKLOAD_TYPE_WORKLOAD]);
  const validStatuses = new Set(STATUS_FILTER_LABELS);
  const validColumns = new Set(DEFAULT_VISIBLE_COLUMN_KEYS);
  const workloadTypes = normalizePreferenceArray(preferences.workloadTypes)
    .map((type) => String(type).trim().toUpperCase())
    .filter((type) => validWorkloadTypes.has(type));
  const statuses = normalizePreferenceArray(preferences.statuses)
    .map((status) => String(status).trim().toUpperCase())
    .filter((status) => validStatuses.has(status));
  const visibleColumnKeys = normalizePreferenceArray(preferences.visibleColumnKeys)
    .map((columnKey) => String(columnKey).trim())
    .filter((columnKey) => validColumns.has(columnKey));

  return {
    period: validPeriods.has(preferences.period)
      ? preferences.period
      : SALES_CENTER_CURRENT_QUARTER,
    sellerMode: preferences.sellerMode === "custom" ? "custom" : "all",
    sellers: normalizePreferenceArray(preferences.sellers).map(String),
    statusMode: preferences.statusMode === "custom" ? "custom" : "all",
    statuses: statuses.length > 0 ? statuses : [...STATUS_FILTER_LABELS],
    territoryIds: normalizePreferenceArray(preferences.territoryIds)
      .map((territoryId) => String(territoryId).trim())
      .filter(Boolean),
    territoryMode: ["all", "custom", "first"].includes(preferences.territoryMode)
      ? preferences.territoryMode
      : "first",
    visibleColumnKeys: visibleColumnKeys.length > 0
      ? visibleColumnKeys
      : [...DEFAULT_VISIBLE_COLUMN_KEYS],
    workloadTypes: workloadTypes.length > 0
      ? workloadTypes
      : [WORKLOAD_TYPE_BOOKING, WORKLOAD_TYPE_WORKLOAD],
  };
}

function normalizePreferenceArray(value) {
  return Array.isArray(value) ? value : [];
}

function saveDashboardPreferences(state) {
  if (!state) {
    return;
  }

  const preferences = normalizeDashboardPreferences({
    period: state.periodSelect?.value || SALES_CENTER_CURRENT_QUARTER,
    sellerMode: state.sellerSelectionMode || "all",
    sellers: Array.from(state.selectedSellers || []),
    statusMode: state.statusAllToggle?.getAttribute("aria-pressed") === "true"
      ? "all"
      : "custom",
    statuses: getSelectedStatuses(state),
    territoryIds: Array.from(state.selectedTerritoryIds || []),
    territoryMode: state.territorySelectionMode || "all",
    visibleColumnKeys: Array.from(
      state.tableState?.visibleColumnKeys || DEFAULT_VISIBLE_COLUMN_KEYS,
    ),
    workloadTypes: getSelectedWorkloadTypes(state),
  });

  state.preferences = preferences;

  try {
    localStorage.setItem(
      SALES_CENTER_PREFERENCES_STORAGE_KEY,
      JSON.stringify(preferences),
    );
  } catch (error) {
    return;
  }
}

function applyDashboardTheme(state, theme) {
  const normalizedTheme = theme === "dark" ? "dark" : "light";
  const isDark = normalizedTheme === "dark";

  state.overlay.classList.toggle("sc-theme-dark", isDark);
  state.overlay.dataset.theme = normalizedTheme;
  state.themeToggleButton.setAttribute("aria-pressed", String(isDark));
  state.themeToggleButton.setAttribute(
    "aria-label",
    isDark ? "Alternar para tema claro" : "Alternar para tema escuro",
  );
  state.themeToggleButton.setAttribute(
    "title",
    isDark ? "Alternar para tema claro" : "Alternar para tema escuro",
  );
}

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

function renderDashboardShell(panel) {
  const frameName = `sales-center-session-${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}`;
  const sessionFrame = createElement("iframe", {
    attributes: {
      allow: "storage-access",
      "aria-hidden": "true",
      name: frameName,
      src: SALES_CLOUD_REFERER,
      tabindex: "-1",
      title: "Sales Center session context",
    },
    className: "sc-session-frame",
  });
  sessionFrame.addEventListener("load", () => {
    sessionFrame.dataset.loaded = "true";
  });
  const titleBlock = createElement("div", { className: "sc-title-block" }, [
    createElement("div", { className: "sc-kicker", text: "Oracle Sales" }),
    createElement("h2", { className: "sc-title", text: "Sales Center" }),
  ]);
  const closeButton = createElement("button", {
    attributes: { "aria-label": "Fechar dashboard", type: "button" },
    className: "sc-icon-button sc-close-button",
  }, [
    createElement("span", {
      attributes: { "aria-hidden": "true" },
      className: "sc-close-icon",
    }),
  ]);
  const themeToggleButton = createElement("button", {
    attributes: {
      "aria-label": "Alternar para tema escuro",
      "aria-pressed": "false",
      title: "Alternar para tema escuro",
      type: "button",
    },
    className: "sc-icon-button sc-theme-toggle",
  }, createThemeToggleIcons());
  const header = createElement("header", { className: "sc-header" }, [
    titleBlock,
    createElement("div", { className: "sc-header-actions" }, [
      themeToggleButton,
      closeButton,
    ]),
  ]);

  const periodSelect = createElement("select", {
    attributes: { id: "sales-center-period" },
    className: "sc-select",
  });
  for (const period of SALES_CENTER_PERIODS) {
    periodSelect.appendChild(
      createElement("option", {
        attributes: { value: period },
        text: period,
      }),
    );
  }
  const refreshButton = createElement("button", {
    attributes: { type: "button" },
    className: "sc-button sc-refresh-button",
    text: "Refresh",
  });
  const debugToggle = createToggleButton("Debug", false, "debug");
  debugToggle.hidden = true;
  const bookingToggle = createToggleButton("Booking", true, "booking");
  const workloadsToggle = createToggleButton("Workloads", true, "workload");
  const workloadTypeGroup = createElement("div", {
    attributes: {
      "aria-label": "Filtro de tipo",
      role: "group",
    },
    className: "sc-toggle-group",
  }, [
    bookingToggle,
    workloadsToggle,
  ]);
  const statusAllToggle = createToggleButton("Todos", true, "status-all");
  const statusToggles = STATUS_FILTER_LABELS.map((status) =>
    createToggleButton(toTitleCase(status), true, `status-${status.toLowerCase()}`, {
      status,
    }),
  );
  const statusFilterGroup = createElement("div", {
    attributes: {
      "aria-label": "Filtro de status",
      role: "group",
    },
    className: "sc-toggle-group sc-status-filter-group",
  }, [
    statusAllToggle,
    ...statusToggles,
  ]);
  const sellerFilterButton = createElement("button", {
    attributes: {
      "aria-expanded": "false",
      type: "button",
    },
    className: "sc-multiselect-button",
    text: "Vendedor: Todos",
  });
  const sellerAllButton = createElement("button", {
    attributes: { type: "button" },
    className: "sc-filter-action",
    text: "Marcar todos",
  });
  const sellerNoneButton = createElement("button", {
    attributes: { type: "button" },
    className: "sc-filter-action",
    text: "Desmarcar todos",
  });
  const sellerFilterList = createElement("div", { className: "sc-multiselect-list" });
  const sellerFilterPanel = createElement("div", {
    attributes: { hidden: "" },
    className: "sc-multiselect-panel",
  }, [
    createElement("div", { className: "sc-filter-actions" }, [
      sellerAllButton,
      sellerNoneButton,
    ]),
    sellerFilterList,
  ]);
  const sellerFilterRoot = createElement("div", { className: "sc-multiselect" }, [
    sellerFilterButton,
    sellerFilterPanel,
  ]);
  const columnFilterButton = createElement("button", {
    attributes: {
      "aria-expanded": "false",
      "aria-label": "Selecionar colunas da tabela",
      title: "Selecionar colunas",
      type: "button",
    },
    className: "sc-icon-button sc-table-columns-button",
  }, [
    createTableColumnsIcon(),
  ]);
  const columnAllButton = createElement("button", {
    attributes: { type: "button" },
    className: "sc-filter-action",
    text: "Marcar todas",
  });
  const columnNoneButton = createElement("button", {
    attributes: { type: "button" },
    className: "sc-filter-action",
    text: "Minimo",
  });
  const columnFilterList = createElement("div", { className: "sc-multiselect-list" });
  const columnFilterPanel = createElement("div", {
    attributes: { hidden: "" },
    className: "sc-multiselect-panel",
  }, [
    createElement("div", { className: "sc-filter-actions" }, [
      columnAllButton,
      columnNoneButton,
    ]),
    columnFilterList,
  ]);
  const columnFilterRoot = createElement(
    "div",
    { className: "sc-column-multiselect" },
    [
      columnFilterButton,
      columnFilterPanel,
    ],
  );
  const territoryFilterButton = createElement("button", {
    attributes: {
      "aria-expanded": "false",
      type: "button",
    },
    className: "sc-multiselect-button",
    text: "Território: Carregando",
  });
  const territoryAllButton = createElement("button", {
    attributes: { type: "button" },
    className: "sc-filter-action",
    text: "Marcar todos",
  });
  const territoryNoneButton = createElement("button", {
    attributes: { type: "button" },
    className: "sc-filter-action",
    text: "Desmarcar todos",
  });
  const territoryFilterList = createElement("div", { className: "sc-multiselect-list" });
  const territoryFilterPanel = createElement("div", {
    attributes: { hidden: "" },
    className: "sc-multiselect-panel",
  }, [
    createElement("div", { className: "sc-filter-actions" }, [
      territoryAllButton,
      territoryNoneButton,
    ]),
    territoryFilterList,
  ]);
  const territoryFilterRoot = createElement("div", { className: "sc-multiselect" }, [
    territoryFilterButton,
    territoryFilterPanel,
  ]);
  const toolbar = createElement("div", { className: "sc-toolbar" }, [
    createElement("label", {
      attributes: { for: "sales-center-period" },
      className: "sc-field",
      text: "Período",
    }),
    periodSelect,
    territoryFilterRoot,
    workloadTypeGroup,
    sellerFilterRoot,
    statusFilterGroup,
    debugToggle,
    refreshButton,
  ]);

  const topLoaderBar = createElement("div", { className: "sc-top-loader-bar" });
  const topLoader = createElement("div", {
    attributes: { "aria-hidden": "true" },
    className: "sc-top-loader",
  }, [
    topLoaderBar,
  ]);
  const summaryGrid = createElement("div", { className: "sc-summary-grid" });
  const statusRegion = createElement("div", {
    attributes: { "aria-live": "polite" },
    className: "sc-status-region",
  });
  const requestInspector = createElement("section", {
    attributes: { hidden: "" },
    className: "sc-request-inspector",
  });
  const tableState = {
    allItems: [],
    expandedRows: new Set(),
    items: [],
    sortDirection: "desc",
    sortKey: "value",
    tableBody: null,
    tableHead: null,
    tableWrap: null,
    visibleColumnKeys: new Set(DEFAULT_VISIBLE_COLUMN_KEYS),
  };

  const tableHead = createElement("thead");
  const tableBody = createElement("tbody");
  const table = createElement("table", { className: "sc-table" }, [
    tableHead,
    tableBody,
  ]);
  tableState.tableBody = tableBody;
  tableState.tableHead = tableHead;
  const tableWrap = createElement("div", { className: "sc-table-wrap" }, [
    columnFilterRoot,
    table,
  ]);
  tableState.tableWrap = tableWrap;
  renderTableHeader(tableState);
  tableHead.addEventListener("click", (event) => {
    const sortButton = event.target.closest(".sc-sort-button");
    if (!sortButton) {
      return;
    }

    updateTableSort(tableState, sortButton.dataset.sortKey);
    renderOpportunityRows(tableState, tableState.items);
  });

  panel.append(
    sessionFrame,
    topLoader,
    header,
    toolbar,
    summaryGrid,
    statusRegion,
    requestInspector,
    tableWrap,
  );

  return {
    bookingToggle,
    closeButton,
    columnAllButton,
    columnFilterButton,
    columnFilterList,
    columnFilterPanel,
    columnFilterRoot,
    columnNoneButton,
    currentDebug: null,
    debugToggle,
    frameName,
    periodSelect,
    refreshButton,
    requestInspector,
    sessionFrame,
    sellerAllButton,
    sellerFilterButton,
    sellerFilterList,
    sellerFilterPanel,
    sellerFilterRoot,
    sellerNoneButton,
    statusAllToggle,
    statusToggles,
    statusPill: null,
    statusRegion,
    summaryGrid,
    tableBody,
    tableHead,
    tableState,
    tableWrap,
    themeToggleButton,
    topLoaderRequestId: null,
    topLoader,
    topLoaderBar,
    topLoaderProgress: 0,
    topLoaderTimer: null,
    territoryAllButton,
    territoryFilterButton,
    territoryFilterList,
    territoryFilterPanel,
    territoryFilterRoot,
    territoryNoneButton,
    availableSellers: [],
    availableTerritories: [],
    selectedSellers: new Set(),
    selectedTerritoryIds: new Set(),
    sellerSelectionMode: "all",
    territorySelectionMode: "all",
    workloadsToggle,
  };
}

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
        text: "Nenhum território",
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
    state.territoryFilterButton.textContent = "Território: Carregando";
    state.territoryFilterButton.setAttribute("aria-label", "Filtro de território carregando");
    return;
  }

  if (selectedCount === 0) {
    state.territoryFilterButton.textContent = "Território: Nenhum";
    state.territoryFilterButton.setAttribute("aria-label", "Filtro de território: nenhum");
    return;
  }

  if (selectedCount === 1) {
    const territoryName = selectedTerritories[0] || "-";
    state.territoryFilterButton.textContent = `Território: ${territoryName}`;
    state.territoryFilterButton.setAttribute(
      "aria-label",
      `Filtro de território: ${territoryName}`,
    );
    return;
  }

  state.territoryFilterButton.textContent =
    selectedCount === totalCount ? "Território: Todos" : `Território: ${selectedCount}`;
  state.territoryFilterButton.setAttribute(
    "aria-label",
    `Filtro de território: ${selectedCount} selecionados`,
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

function getVisibleTableColumns(tableState) {
  const visibleKeys = tableState.visibleColumnKeys || new Set(DEFAULT_VISIBLE_COLUMN_KEYS);
  const visibleColumns = SELECTABLE_TABLE_COLUMNS.filter((column) =>
    visibleKeys.has(column.key),
  );
  const detailsColumn = TABLE_COLUMNS.find((column) => column.key === "details");

  return detailsColumn ? [...visibleColumns, detailsColumn] : visibleColumns;
}

function getVisibleColumnCount(tableState) {
  return Math.max(1, getVisibleTableColumns(tableState).length);
}

function renderTableHeader(tableState) {
  const headerRow = createElement("tr");

  for (const column of getVisibleTableColumns(tableState)) {
    const headerCell = createElement("th", {
      className: getHeaderCellClassName(column),
    });

    if (column.sortable === false) {
      headerCell.textContent = column.label;
    } else {
      headerCell.appendChild(
        createElement("button", {
          attributes: {
            "aria-label": `Ordenar por ${column.label}`,
            type: "button",
          },
          className: "sc-sort-button",
          dataset: { sortKey: column.key },
          text: column.label,
        }),
      );
    }

    headerRow.appendChild(headerCell);
  }

  tableState.tableHead.replaceChildren(headerRow);
  ensureVisibleSortColumn(tableState);
  syncSortButtons(tableState);
}

function ensureVisibleSortColumn(tableState) {
  const visibleColumns = getVisibleTableColumns(tableState);
  const isSortColumnVisible = visibleColumns.some((column) => column.key === tableState.sortKey);

  if (isSortColumnVisible) {
    return;
  }

  const firstSortableColumn = visibleColumns.find((column) => column.sortable !== false);
  tableState.sortKey = firstSortableColumn?.key || "opportunity";
  tableState.sortDirection = "asc";
}

function renderOpportunityRows(tableState, items = tableState.items) {
  const previousScrollTop = tableState.tableWrap?.scrollTop || 0;
  const previousScrollLeft = tableState.tableWrap?.scrollLeft || 0;
  tableState.items = items;
  ensureVisibleSortColumn(tableState);
  syncSortButtons(tableState);
  const fragment = document.createDocumentFragment();
  const sortedItems = sortOpportunityItems(items, tableState);
  const visibleColumns = getVisibleTableColumns(tableState);

  for (const item of sortedItems) {
    const rowId = getRowId(item);
    const row = createElement("tr");
    row.dataset.rowId = rowId;

    for (const column of visibleColumns) {
      const cell = createElement("td", {
        className: getCellClassName(column),
      });
      renderOpportunityCell(cell, item, column, tableState);
      row.appendChild(cell);
    }

    fragment.appendChild(row);

    if (tableState.expandedRows.has(rowId)) {
      fragment.appendChild(renderDetailsRow(item, tableState));
    }
  }

  tableState.tableBody.replaceChildren(fragment);

  if (tableState.tableWrap) {
    tableState.tableWrap.scrollTop = previousScrollTop;
    tableState.tableWrap.scrollLeft = previousScrollLeft;
  }
}

function getCellClassName(column) {
  if (column.type === "currency" || column.type === "number" || column.type === "percent") {
    return "sc-cell-numeric";
  }

  if (column.key === "opportunity") {
    return "sc-cell-opportunity";
  }

  if (column.key === "details") {
    return "sc-cell-details";
  }

  return "";
}

function getHeaderCellClassName(column) {
  if (column.type === "currency" || column.type === "number" || column.type === "percent") {
    return "sc-header-numeric";
  }

  if (column.key === "details") {
    return "sc-header-details";
  }

  return "";
}

function renderOpportunityCell(cell, item, column, tableState) {
  if (column.key === "opportunity") {
    renderOpportunityIdentityCell(cell, item, column);
    return;
  }

  if (column.key === "status") {
    renderStatusCell(cell, item, column);
    return;
  }

  if (column.key === "risk") {
    renderRiskCell(cell, item, column);
    return;
  }

  if (column.key === "type") {
    renderTypeCell(cell, item, column);
    return;
  }

  if (column.key === "stage") {
    renderStageCell(cell, item, column);
    return;
  }

  if (column.key === "channel") {
    renderChannelCell(cell, item, column);
    return;
  }

  if (column.key === "value") {
    cell.textContent = formatAmountValue(getCalculatedValueAmount(item));
    return;
  }

  if (column.key === "details") {
    renderDetailsToggleCell(cell, item, tableState);
    return;
  }

  const value = formatCellValue(findValueByAliases(item, column.aliases), column.type);
  cell.textContent = value;
}

function renderDetailsToggleCell(cell, item, tableState) {
  const rowId = getRowId(item);
  const isExpanded = tableState.expandedRows.has(rowId);
  const button = createElement("button", {
    attributes: {
      "aria-expanded": String(isExpanded),
      type: "button",
    },
    className: "sc-detail-toggle",
    text: isExpanded ? "Ocultar" : "Detalhes",
  });

  button.addEventListener("click", () => {
    if (tableState.expandedRows.has(rowId)) {
      tableState.expandedRows.delete(rowId);
    } else {
      tableState.expandedRows.add(rowId);
    }

    renderOpportunityRows(tableState);
  });

  cell.appendChild(button);
}

function renderDetailsRow(item, tableState) {
  const row = createElement("tr", { className: "sc-details-row" });
  const cell = createElement("td", {
    attributes: { colspan: String(getVisibleColumnCount(tableState)) },
    className: "sc-details-cell",
  });
  const grid = createElement("div", { className: "sc-details-grid" });
  const details = [
    {
      label: "WHY BUY NOW",
      value: findValueByAliases(item, [
        "whyBuyNow",
        "whyNow",
        "why_buy_now",
        "compellingEvent",
        "customerNeed",
      ]),
    },
    {
      label: "ACTION TO CLOSE",
      value: findValueByAliases(item, [
        "actionToClose",
        "actionsToClose",
        "nextStep",
        "nextSteps",
        "closePlan",
      ]),
    },
    {
      label: "RISCOS",
      value: findValueByAliases(item, [
        "riskDescription",
        "riskDetails",
        "risks",
        "risk",
        "dealRisk",
      ]),
    },
    {
      label: "CONCORRENTE",
      value: findValueByAliases(item, [
        "competitor",
        "competitorName",
        "primaryCompetitor",
        "concorrente",
      ]),
    },
  ];

  for (const detail of details) {
    grid.appendChild(
      createElement("section", { className: "sc-detail-card" }, [
        createElement("h3", { text: detail.label }),
        createElement("p", { text: detail.value ? String(detail.value) : "-" }),
      ]),
    );
  }

  cell.appendChild(grid);
  row.appendChild(cell);
  return row;
}

function renderOpportunityIdentityCell(cell, item, column) {
  const title =
    findValueByAliases(item, column.aliases) ||
    findFirstValueByKeyHint(item, ["opty", "opportunity", "deal"]);
  const customer = findValueByAliases(item, [
    "customerName",
    "accountName",
    "targetPartyName",
    "partyName",
    "primaryCustomerName",
    "customer",
    "account",
  ]);
  const product = findValueByAliases(item, [
    "productName",
    "productDescription",
    "productLine",
    "productGroup",
    "productPillar",
    "itemDescription",
    "revenueType",
  ]);
  const workload = findValueByAliases(item, ["workloadName"]);
  const opportunityNumber = findValueByAliases(item, ["optyNumber"]);
  const opportunityId = findValueByAliases(item, ["opportunityId"]);
  const revenueId = findValueByAliases(item, ["revenueId"]);
  const detailParts = [];

  if (opportunityNumber) {
    detailParts.push(
      createElement("a", {
        attributes: {
          href:
            `${OPPORTUNITY_DETAIL_BASE_URL}?id=${encodeURIComponent(String(opportunityId ?? ""))}` +
            `&puid=${encodeURIComponent(String(opportunityNumber))}`,
          rel: "noopener noreferrer",
          target: "_blank",
        },
        className: "sc-oppty-link",
        text: String(opportunityNumber),
      }),
    );
  }

  if (product) {
    detailParts.push(
      createElement("span", {
        text: String(product),
      }),
    );
  }

  if (workload) {
    detailParts.push(
      revenueId
        ? createElement("a", {
            attributes: {
              href: `${WORKLOAD_DETAIL_BASE_URL}${encodeURIComponent(String(revenueId))}`,
              rel: "noopener noreferrer",
              target: "_blank",
            },
            className: "sc-oppty-link",
            text: String(workload),
          })
        : createElement("span", { text: String(workload) }),
    );
  }

  cell.appendChild(
    createElement("div", {
      className: "sc-oppty-title",
      text: title ? String(title) : "-",
    }),
  );

  if (customer) {
    cell.appendChild(
      createElement("div", {
        className: "sc-oppty-subtitle",
        text: String(customer),
      }),
    );
  }

  if (detailParts.length > 0) {
    const meta = createElement("div", { className: "sc-oppty-meta" });

    detailParts.forEach((part, index) => {
      if (index > 0) {
        meta.appendChild(createElement("span", { text: " · " }));
      }

      meta.appendChild(part);
    });

    cell.appendChild(meta);
    return;
  }
}

function renderStatusCell(cell, item, column) {
  const winProbability = getRevenueWinProbability(item, column.aliases);
  const value = getStatusTextByWinProbability(winProbability);
  const tone = getStatusToneByText(value);

  cell.appendChild(
    createElement("span", {
      className: `sc-status-token sc-status-token-${tone}`,
      text: value,
    }),
  );
}

function getRevenueWinProbability(item, aliases = ["revnWinProbability"]) {
  const value = findValueByAliases(item, aliases);
  const numberValue = Number(String(value ?? "").replace(/,/g, ""));

  return Number.isFinite(numberValue) ? numberValue : null;
}

function getStatusTextByWinProbability(winProbability) {
  if (winProbability === 10) {
    return "LEAD";
  }

  if (winProbability >= 20 && winProbability <= 30) {
    return "PIPELINE";
  }

  if (winProbability >= 40 && winProbability <= 50) {
    return "UPSIDE";
  }

  if (winProbability >= 60 && winProbability <= 90) {
    return "FORECAST";
  }

  if (winProbability === 100) {
    return "WON";
  }

  return "OPEN";
}

function getStatusToneByText(text) {
  const normalizedText = String(text || "").toLowerCase();

  return [
    "lead",
    "pipeline",
    "upside",
    "forecast",
    "won",
    "open",
  ].includes(normalizedText)
    ? normalizedText
    : "neutral";
}

function renderRiskCell(cell, item, column) {
  const value = formatStatusText(findValueByAliases(item, column.aliases) || "N/A");
  const score = findValueByAliases(item, [
    "riskScore",
    "score",
    "riskScoreValue",
    "dealRiskScore",
  ]);
  const tone = value.includes("MODERATE")
    ? "warning"
    : value === "N/A"
      ? "neutral"
      : "info";

  cell.appendChild(
    createElement("span", {
      className: `sc-risk-token sc-risk-token-${tone}`,
      text: value,
    }),
  );
  cell.appendChild(
    createElement("div", {
      className: "sc-cell-subline",
      text: score !== null && score !== undefined && score !== ""
        ? `score ${score}`
        : "score -",
    }),
  );
}

function renderTypeCell(cell, item, column) {
  const rawValue = findValueByAliases(item, column.aliases);
  const normalizedValue = String(rawValue || "").trim().toUpperCase();
  const text = normalizedValue === "W"
    ? "Workload"
    : normalizedValue === "B"
      ? "Booking"
      : formatCellValue(rawValue);

  const tone = normalizedValue === "W"
    ? "workload"
    : normalizedValue === "B"
      ? "booking"
      : "neutral";

  cell.appendChild(
    createElement("span", {
      className: `sc-type-badge sc-type-badge-${tone}`,
      text,
    }),
  );
}

function renderStageCell(cell, item, column) {
  const stage = formatCellValue(findValueByAliases(item, column.aliases));
  const subStage = findValueByAliases(item, [
    "revenueType",
    "revenueTypeCategory",
    "forecastCategory",
    "forecastCategoryCode",
    "commitStatus",
    "forecastStatusCode",
  ]);

  cell.appendChild(createElement("div", { className: "sc-stage-primary", text: stage }));

  if (subStage) {
    cell.appendChild(
      createElement("div", {
        className: "sc-cell-subline",
        text: String(subStage),
      }),
    );
  }
}

function renderChannelCell(cell, item, column) {
  const channel = findValueByAliases(item, column.aliases);
  const location = findValueByAliases(item, [
    "city",
    "state",
    "location",
    "customerLocation",
    "partnerLocation",
    "territoryName",
  ]);

  cell.appendChild(
    createElement("div", {
      className: "sc-channel-primary",
      text: channel ? String(channel) : "-",
    }),
  );

  if (location) {
    cell.appendChild(
      createElement("div", {
        className: "sc-cell-subline",
        text: String(location),
      }),
    );
  }
}

function renderEmptyRows(state, message) {
  const row = createElement("tr");
  row.appendChild(
    createElement("td", {
      attributes: { colspan: String(getVisibleColumnCount(state.tableState)) },
      className: "sc-empty-cell",
      text: message,
    }),
  );
  state.tableState.items = [];
  state.tableState.expandedRows.clear();
  state.tableBody.replaceChildren(row);
}

function updateTableSort(tableState, sortKey) {
  if (tableState.sortKey === sortKey) {
    tableState.sortDirection = tableState.sortDirection === "asc" ? "desc" : "asc";
    return;
  }

  tableState.sortKey = sortKey;
  tableState.sortDirection = "asc";
}

function syncSortButtons(tableState) {
  if (!tableState.tableHead) {
    return;
  }

  for (const button of tableState.tableHead.querySelectorAll(".sc-sort-button")) {
    const isActive = button.dataset.sortKey === tableState.sortKey;
    button.classList.toggle("sc-sort-active", isActive);
    button.dataset.direction = isActive ? tableState.sortDirection : "";
    button.setAttribute(
      "aria-sort",
      isActive
        ? tableState.sortDirection === "asc"
          ? "ascending"
          : "descending"
        : "none",
    );
  }
}

function sortOpportunityItems(items, tableState) {
  const direction = tableState.sortDirection === "asc" ? 1 : -1;
  const column = TABLE_COLUMNS.find((candidate) => candidate.key === tableState.sortKey);

  if (!column || column.sortable === false) {
    return [...items];
  }

  return [...items].sort((itemA, itemB) => {
    const valueA = getSortValue(itemA, column);
    const valueB = getSortValue(itemB, column);

    if (valueA === valueB) {
      return 0;
    }

    if (valueA === null || valueA === undefined || valueA === "") {
      return 1;
    }

    if (valueB === null || valueB === undefined || valueB === "") {
      return -1;
    }

    if (typeof valueA === "number" && typeof valueB === "number") {
      return (valueA - valueB) * direction;
    }

    return String(valueA).localeCompare(String(valueB), "pt-BR", {
      numeric: true,
      sensitivity: "base",
    }) * direction;
  });
}

function getSortValue(item, column) {
  if (column.key === "opportunity") {
    return (
      findValueByAliases(item, column.aliases) ||
      findFirstValueByKeyHint(item, ["opty", "opportunity", "deal"]) ||
      ""
    );
  }

  if (column.key === "status") {
    const probability = getRevenueWinProbability(item, column.aliases);
    return probability === null ? "" : probability;
  }

  if (column.key === "value") {
    return getCalculatedValueAmount(item);
  }

  const rawValue = findValueByAliases(item, column.aliases);

  if (column.type === "currency" || column.type === "number" || column.type === "percent") {
    const numberValue = Number(String(rawValue ?? "").replace(/,/g, ""));
    if (Number.isFinite(numberValue)) {
      return column.type === "percent" && numberValue > 0 && numberValue <= 1
        ? numberValue * 100
        : numberValue;
    }
  }

  if (column.type === "date" || column.type === "fiscalWeek") {
    const date = typeof rawValue === "number" ? new Date(rawValue) : new Date(String(rawValue));
    return Number.isNaN(date.getTime()) ? rawValue : date.getTime();
  }

  return rawValue ?? "";
}

function getRowId(item) {
  const explicitId = findValueByAliases(item, [
    "revenueLineId",
    "revenueId",
    "optyId",
    "opportunityId",
    "opportunityNumber",
    "optyNumber",
  ]);

  if (explicitId !== null && explicitId !== undefined && explicitId !== "") {
    return String(explicitId);
  }

  return stableStringify(item);
}

function stableStringify(value) {
  if (!value || typeof value !== "object") {
    return String(value);
  }

  return JSON.stringify(
    Object.keys(value)
      .sort()
      .reduce((accumulator, key) => {
        accumulator[key] = value[key];
        return accumulator;
      }, {}),
  );
}

function setStatusPill(state, text, tone) {
  if (!state.statusPill) {
    return;
  }

  state.statusPill.textContent = text;
  state.statusPill.className = `sc-status-pill sc-status-${tone}`;
}

function sendRuntimeMessage(message) {
  if (globalThis.SalesCenterInfra?.createChromeRuntimeAdapter) {
    return SalesCenterInfra.createChromeRuntimeAdapter().sendMessage(message);
  }

  return new Promise((resolve, reject) => {
    if (
      typeof chrome === "undefined" ||
      !chrome.runtime ||
      !chrome.runtime.sendMessage
    ) {
      reject(new Error("Chrome runtime indisponível para esta página."));
      return;
    }

    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response);
    });
  });
}

function waitForSessionFrameLoad(frame) {
  return new Promise((resolve, reject) => {
    if (!frame) {
      reject(new Error("Iframe de sessão SalesCloud não foi criado."));
      return;
    }

    if (frame.dataset.loaded === "true") {
      resolve();
      return;
    }

    const refreshAfterMs = 12000;
    const maxRefreshes = 2;
    let forcedStabilizationRefresh = false;
    let refreshCount = 0;
    let refreshTimerId = null;
    const scheduleRefresh = () => {
      refreshTimerId = window.setTimeout(() => {
        if (frame.dataset.loaded === "true") {
          return;
        }

        if (refreshCount < maxRefreshes) {
          refreshCount += 1;
          frame.dataset.loaded = "false";
          frame.src = SALES_CLOUD_REFERER;
          scheduleRefresh();
        }
      }, refreshAfterMs);
    };

    const timeoutId = window.setTimeout(() => {
      frame.removeEventListener("load", handleLoad);
      window.clearTimeout(refreshTimerId);
      reject(new Error("Iframe SalesCloudSMC-GEC não terminou de carregar."));
    }, 60000);

    const handleLoad = () => {
      if (!forcedStabilizationRefresh && refreshCount < maxRefreshes) {
        forcedStabilizationRefresh = true;
        refreshCount += 1;
        frame.dataset.loaded = "false";
        frame.src = SALES_CLOUD_REFERER;
        return;
      }

      frame.dataset.loaded = "true";
      window.clearTimeout(refreshTimerId);
      window.clearTimeout(timeoutId);
      resolve();
    };

    frame.addEventListener("load", handleLoad, { once: true });
    scheduleRefresh();
  });
}

function findValueByAliases(source, aliases) {
  if (!source || typeof source !== "object") {
    return null;
  }

  for (const alias of aliases) {
    if (source[alias] !== undefined && source[alias] !== null) {
      return source[alias];
    }
  }

  const lowerCaseAliases = new Set(aliases.map((alias) => alias.toLowerCase()));
  for (const [key, value] of Object.entries(source)) {
    if (lowerCaseAliases.has(key.toLowerCase()) && value !== null) {
      return value;
    }
  }

  const normalizedAliases = new Set(aliases.map(normalizeFieldName));
  for (const [key, value] of Object.entries(source)) {
    if (normalizedAliases.has(normalizeFieldName(key)) && value !== null) {
      return value;
    }
  }

  return null;
}

function findFirstValueByKeyHint(source, hints) {
  if (!source || typeof source !== "object") {
    return null;
  }

  const normalizedHints = hints.map(normalizeFieldName);

  for (const [key, value] of Object.entries(source)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    const normalizedKey = normalizeFieldName(key);
    if (normalizedHints.some((hint) => normalizedKey.includes(hint))) {
      return value;
    }
  }

  return null;
}

function normalizeFieldName(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function formatCellValue(value, type = "text") {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  if (type === "currency") {
    return formatAmountValue(value);
  }

  if (type === "percent") {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
      return String(value);
    }

    const percentValue =
      numberValue > 0 && numberValue <= 1 ? numberValue * 100 : numberValue;
    return `${Math.round(percentValue)}%`;
  }

  if (type === "number") {
    const numberValue = Number(String(value).replace(/,/g, ""));
    return Number.isFinite(numberValue)
      ? numberFormatter.format(Math.round(numberValue))
      : String(value);
  }

  if (type === "date") {
    return formatDateValue(value);
  }

  if (type === "fiscalWeek") {
    return formatFiscalWeekValue(value);
  }

  return String(value);
}

function formatFiscalWeekValue(value) {
  const date = parseDateValue(value);

  if (!date) {
    return "-";
  }

  const fiscalYear = getOracleFiscalYear(date);
  const fiscalYearShort = String(fiscalYear % 100).padStart(2, "0");
  const fiscalYearStart = Date.UTC(fiscalYear - 1, 5, 1);
  const dateStart = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
  );
  const daysFromFiscalStart = Math.floor((dateStart - fiscalYearStart) / 86400000);
  const fiscalWeek = Math.floor(daysFromFiscalStart / 7) + 1;

  return `FY${fiscalYearShort}-W${String(fiscalWeek).padStart(2, "0")}`;
}

function getOracleFiscalYear(date) {
  const calendarYear = date.getUTCFullYear();
  const calendarMonth = date.getUTCMonth();

  return calendarMonth >= 5 ? calendarYear + 1 : calendarYear;
}

function formatDateValue(value) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  const date = parseDateValue(value);
  if (!date) {
    return String(value);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function parseDateValue(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const date = typeof value === "number" ? new Date(value) : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatAmountValue(value) {
  if (value === undefined || value === null || value === "") {
    return "-";
  }

  const numberValue = Number(String(value).replace(/,/g, ""));

  if (!Number.isFinite(numberValue)) {
    return String(value);
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(numberValue);
}

function formatStatusText(value) {
  if (value === undefined || value === null || value === "") {
    return "N/A";
  }

  return String(value).trim().toUpperCase();
}

function observeOracleShell() {
  let scheduled = false;

  const scheduleEnsureCard = () => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      ensureSalesCenterCard();
    });
  };

  const observer = new MutationObserver(scheduleEnsureCard);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });

  scheduleEnsureCard();
}

observeOracleShell();
