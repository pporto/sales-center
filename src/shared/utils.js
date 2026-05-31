"use strict";

function getCurrentYear() {
  return new Date().getFullYear();
}

function normalizePeriod(value) {
  const periods = globalThis.SalesCenterConstants.PERIODS;

  if (value === periods.NEXT_QUARTER) return periods.NEXT_QUARTER;
  if (value === periods.PREVIOUS_QUARTER) return periods.PREVIOUS_QUARTER;
  if (value === periods.CURRENT_FISCAL_YEAR) return periods.CURRENT_FISCAL_YEAR;
  if (value === periods.ROLLING_QUARTERS) return periods.ROLLING_QUARTERS;
  if (value === periods.RENEWALS) return periods.RENEWALS;

  return periods.CURRENT_QUARTER;
}

function normalizeTerritoryId(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function normalizeTerritoryIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(
    new Set(value.map(normalizeTerritoryId).filter(Boolean)),
  );
}

function timestampToIsoDate(value) {
  const date = new Date(Number(value));
  if (Number.isNaN(date.getTime())) {
    throw new globalThis.SalesCenterRequestError(
      `Timestamp invalido retornado pelo forecast: ${value}`,
      422,
    );
  }

  return date.toISOString().slice(0, 10);
}

globalThis.SalesCenterUtils = {
  getCurrentYear,
  normalizePeriod,
  normalizeTerritoryId,
  normalizeTerritoryIds,
  timestampToIsoDate,
};
