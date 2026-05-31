"use strict";

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
    label: "ESTÃGIO",
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
