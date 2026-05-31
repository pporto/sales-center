"use strict";

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
    text: "TerritÃ³rio: Carregando",
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
      text: "PerÃ­odo",
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
