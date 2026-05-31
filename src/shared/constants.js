"use strict";

globalThis.SalesCenterConstants = {
  API_BASE: "https://gxpap-e.oracle.com/oalcrm/web/SalesForecastServices-GEC",
  API_ORIGIN: "https://gxpap-e.oracle.com",
  CACHE_NAMESPACE: "salesCenter:v1",
  CACHE_TTL_MS: {
    dashboard: 9 * 60 * 60 * 1000,
  },
  MAX_REVENUE_PAGES: 500,
  PERIODS: {
    CURRENT_FISCAL_YEAR: "Current Fiscal Year",
    CURRENT_QUARTER: "Current Quarter",
    NEXT_QUARTER: "Next Quarter",
    PREVIOUS_QUARTER: "Previous Quarter",
    RENEWALS: "RENEWALS (Current + Past Due)",
    ROLLING_QUARTERS: "4 Rolling Quarters (CQ + 3)",
  },
  REQUEST_CACHE_MAX_ENTRIES: 20,
  REQUEST_CACHE_STORAGE_KEY: "salesCenter.requestCache.v1",
  REQUEST_VERSION_SUFFIX: "-01-30T163200.068Z",
  REVENUE_PAGE_LIMIT: 100,
  REVENUE_PROGRESS_END: 96,
  REVENUE_PROGRESS_START: 32,
  SALES_CLOUD_BOOTSTRAP_URL: "https://gxpap-e.oracle.com/oalcrm/web/SalesCloudSMC-GEC/",
  SALES_CLOUD_FRAME_MAX_REFRESHES: 2,
  SALES_CLOUD_FRAME_REFRESH_AFTER_MS: 12000,
  SALES_CLOUD_MOUNT_SETTLE_MS: 1000,
  SALES_CLOUD_REFERER: "https://gxpap-e.oracle.com/oalcrm/web/SalesCloudSMC-GEC/",
  SALES_CLOUD_TAB_MAX_RECREATES: 2,
  SALES_CLOUD_TAB_MAX_REFRESHES: 8,
  SALES_CLOUD_TAB_REFRESH_AFTER_MS: 10000,
  SALES_CLOUD_TAB_TIMEOUT_MS: 150000,
};
