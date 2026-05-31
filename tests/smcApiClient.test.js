"use strict";

const assert = require("node:assert/strict");

require("../src/shared/constants.js");
require("../src/shared/errors.js");
require("../src/shared/utils.js");
require("../src/background/smcApiClient.js");

const apiClient = SalesCenterBackground.createSmcApiClient({
  fetchJson: async () => [],
  publishProgress: () => {},
});

const activeForecastUrl = apiClient.internals.getForecastActiveUrl();
assert.ok(activeForecastUrl.includes("/resources/forecast/ACTIVE"));
assert.ok(activeForecastUrl.includes(SalesCenterConstants.REQUEST_VERSION_SUFFIX));

const payload = apiClient.internals.createRevenuePayload({
  endDate: Date.UTC(2026, 5, 30),
  forecastHeaderId: 123,
  startDate: Date.UTC(2026, 3, 1),
  territoryId: 456,
}, 0, {
  renewalForecast: true,
  selectedTerritoryIds: ["456"],
});

assert.equal(payload.limit, SalesCenterConstants.REVENUE_PAGE_LIMIT);
assert.equal(payload.offset, 0);
assert.equal(payload.isRenewalForecast, true);
assert.deepEqual(payload.territoryIds, [456]);
assert.deepEqual(payload.forecastHeaders, [{
  endDate: "2026-06-30",
  id: 123,
  startDate: "2026-04-01",
}]);

console.log("smcApiClient.test.js passed");
