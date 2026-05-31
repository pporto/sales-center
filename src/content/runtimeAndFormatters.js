"use strict";

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
      reject(new Error("Chrome runtime indisponÃ­vel para esta pÃ¡gina."));
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
      reject(new Error("Iframe de sessÃ£o SalesCloud nÃ£o foi criado."));
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
      reject(new Error("Iframe SalesCloudSMC-GEC nÃ£o terminou de carregar."));
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

