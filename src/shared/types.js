"use strict";

/**
 * @typedef {Object} DashboardQuery
 * @property {string} period
 * @property {string[]} territoryIds
 * @property {boolean=} forceRefresh
 */

/**
 * @typedef {Object} CacheMeta
 * @property {"hit"|"miss"|"refresh"|"stale"} status
 * @property {string=} cachedAt
 * @property {string=} expiresAt
 */

/**
 * @typedef {Object} DashboardData
 * @property {Array<Object>} items
 * @property {Array<Object>} forecastActiveOptions
 * @property {Object} forecast
 * @property {string[]} selectedTerritoryIds
 * @property {string} generatedAt
 * @property {CacheMeta=} cache
 */

globalThis.SalesCenterTypes = {};
