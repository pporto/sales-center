"use strict";

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
