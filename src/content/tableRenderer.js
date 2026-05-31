"use strict";

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
        meta.appendChild(createElement("span", { text: " Â· " }));
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
