"use strict";

var SESSION_API_ORIGIN = SalesCenterConstants.API_ORIGIN;
var SESSION_SALES_CLOUD_API_PROBE_AFTER_COMPLETE_MS = SalesCenterConstants.SALES_CLOUD_API_PROBE_AFTER_COMPLETE_MS;
var SESSION_SALES_CLOUD_BOOTSTRAP_URL = SalesCenterConstants.SALES_CLOUD_BOOTSTRAP_URL;
var SESSION_SALES_CLOUD_FRAME_MAX_REFRESHES = SalesCenterConstants.SALES_CLOUD_FRAME_MAX_REFRESHES;
var SESSION_SALES_CLOUD_FRAME_REFRESH_AFTER_MS = SalesCenterConstants.SALES_CLOUD_FRAME_REFRESH_AFTER_MS;
var SESSION_SALES_CLOUD_REFERER = SalesCenterConstants.SALES_CLOUD_REFERER;
var SESSION_SALES_CLOUD_TAB_MAX_RECREATES = SalesCenterConstants.SALES_CLOUD_TAB_MAX_RECREATES;
var SESSION_SALES_CLOUD_TAB_MAX_REFRESHES = SalesCenterConstants.SALES_CLOUD_TAB_MAX_REFRESHES;
var SESSION_SALES_CLOUD_TAB_REFRESH_AFTER_MS = SalesCenterConstants.SALES_CLOUD_TAB_REFRESH_AFTER_MS;
var SESSION_SALES_CLOUD_TAB_TIMEOUT_MS = SalesCenterConstants.SALES_CLOUD_TAB_TIMEOUT_MS;


async function warmSalesCloudSession(requestContext) {
  const [executionResult] = await chrome.scripting.executeScript({
    args: [{ referer: SESSION_SALES_CLOUD_REFERER }],
    func: async ({ referer }) => {
      const result = {
        href: window.location.href,
        readyState: document.readyState,
        storageHints: [],
      };

      try {
        await fetch(referer, {
          cache: "reload",
          credentials: "include",
          method: "GET",
        });
      } catch (error) {
        result.fetchError = error?.message || String(error);
      }

      try {
        const storages = [window.localStorage, window.sessionStorage];
        for (const storage of storages) {
          for (let index = 0; index < storage.length; index += 1) {
            const key = storage.key(index);
            if (/auth|session/i.test(key || "")) {
              result.storageHints.push(key);
            }
          }
        }
      } catch (error) {
        result.storageError = error?.message || String(error);
      }

      return result;
    },
    target: {
      frameIds: [requestContext.executionFrameId ?? requestContext.frameId],
      tabId: requestContext.executionTabId ?? requestContext.tabId,
    },
    world: "MAIN",
  });

  requestContext.debug.sessionRecovery.push({
    completedAt: new Date().toISOString(),
    frame: executionResult?.result || null,
    step: "warmSalesCloudSession",
  });
  await delay(1000);
}

async function prepareSalesCloudFrameStorageAccess(requestContext) {
  try {
    const [executionResult] = await chrome.scripting.executeScript({
      func: async () => {
        const result = {
          hasStorageAccess: null,
          requestStorageAccess: "unavailable",
        };

        if (typeof document.hasStorageAccess === "function") {
          result.hasStorageAccess = await document.hasStorageAccess();
        }

        if (!result.hasStorageAccess && typeof document.requestStorageAccess === "function") {
          try {
            await document.requestStorageAccess();
            result.requestStorageAccess = "granted";
            result.hasStorageAccess = typeof document.hasStorageAccess === "function"
              ? await document.hasStorageAccess()
              : true;
          } catch (error) {
            result.requestStorageAccess = "denied";
            result.error = error?.message || String(error);
          }
        }

        return result;
      },
      target: {
        frameIds: [requestContext.executionFrameId ?? requestContext.frameId],
        tabId: requestContext.executionTabId ?? requestContext.tabId,
      },
      world: "MAIN",
    });

    requestContext.debug.sessionRecovery.push({
      result: executionResult?.result || null,
      step: "prepareSalesCloudFrameStorageAccess",
      triggeredAt: new Date().toISOString(),
    });
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      error: error?.message || String(error),
      step: "prepareSalesCloudFrameStorageAccess",
      triggeredAt: new Date().toISOString(),
    });
  }
}

function setSalesCloudExecutionContext(requestContext, tabId, frameId, source) {
  requestContext.executionTabId = tabId;
  requestContext.executionFrameId = frameId;
  requestContext.executionSource = source;
  requestContext.debug.executionContext = {
    frameId,
    source,
    tabId,
    updatedAt: new Date().toISOString(),
  };
}

async function preferExistingSalesCloudTabContext(requestContext) {
  const context = await findExistingSalesCloudTabContext(requestContext);

  if (!context) {
    return false;
  }

  setSalesCloudExecutionContext(
    requestContext,
    context.tabId,
    context.frameId,
    "existing gxpap-e.oracle.com tab",
  );
  if (!await probeSalesCloudApiReadyOnce(requestContext, context.tabId, context.frameId)) {
    requestContext.debug.sessionRecovery.push({
      href: context.href,
      readyState: context.readyState,
      step: "preferExistingSalesCloudTabContext",
      usable: false,
    });
    return false;
  }

  requestContext.debug.sessionRecovery.push({
    href: context.href,
    readyState: context.readyState,
    step: "preferExistingSalesCloudTabContext",
    switchedAt: new Date().toISOString(),
  });
  return true;
}

async function ensureSalesCloudExecutionContext(requestContext, options = {}) {
  if (
    !options.forceTemporaryTab &&
    await preferExistingSalesCloudTabContext(requestContext)
  ) {
    return true;
  }

  if (!options.forceTemporaryTab) {
    try {
      const frameId = await waitForSalesCloudFrame(requestContext);
      setSalesCloudExecutionContext(
        requestContext,
        requestContext.tabId,
        frameId,
        "hidden iframe in current Oracle HCM tab",
      );
      await prepareSalesCloudFrameStorageAccess(requestContext);
      if (!await probeSalesCloudApiReadyOnce(requestContext, requestContext.tabId, frameId)) {
        throw new SalesCenterRequestError(
          "Iframe SalesCloudSMC-GEC carregou, mas a API ainda retornou sessao invalida.",
          401,
          requestContext.debug,
          { code: "SESSION_HTML" },
        );
      }

      requestContext.debug.sessionRecovery.push({
        frameId,
        step: "ensureSalesCloudExecutionContext",
        switchedAt: new Date().toISOString(),
      });
      return true;
    } catch (error) {
      requestContext.debug.sessionRecovery.push({
        error: error?.message || String(error),
        reason: "hidden iframe unavailable",
        step: "ensureSalesCloudExecutionContext",
      });
    }
  }

  return createTemporarySalesCloudTabContext(requestContext, {
    reason: options.reason || "automatic first-party session recovery",
  });
}

async function createTemporarySalesCloudTabContext(requestContext, options = {}) {
  let tabId = requestContext.temporarySalesCloudTabId;

  if (!tabId) {
    try {
      const tab = await chrome.tabs.create({
        active: false,
        url: SESSION_SALES_CLOUD_BOOTSTRAP_URL,
      });
      tabId = tab.id;
      requestContext.temporarySalesCloudTabId = tabId;
      requestContext.debug.sessionRecovery.push({
        reason: options.reason || null,
        step: "createTemporarySalesCloudTabContext",
        tabId,
        triggeredAt: new Date().toISOString(),
      });
    } catch (error) {
      throw new SalesCenterRequestError(
        "Nao foi possivel abrir o contexto temporario SalesCloud.",
        500,
        requestContext.debug,
        {
          code: "SESSION_BOOTSTRAP_UNAVAILABLE",
          details: error?.message || String(error),
        },
      );
    }
  }

  const context = await waitForSalesCloudTabContext(requestContext, tabId);
  setSalesCloudExecutionContext(
    requestContext,
    context.tabId,
    context.frameId,
    "temporary inactive gxpap-e.oracle.com tab",
  );
  requestContext.debug.sessionRecovery.push({
    frameId: context.frameId,
    href: context.href,
    readyState: context.readyState,
    step: "createTemporarySalesCloudTabContext",
    switchedAt: new Date().toISOString(),
    tabId: context.tabId,
  });
  return true;
}

async function waitForSalesCloudTabContext(requestContext, initialTabId) {
  let tabId = initialTabId;
  const timeoutAt = Date.now() + SESSION_SALES_CLOUD_TAB_TIMEOUT_MS;
  let firstIncompleteAt = null;
  let forcedStabilizationRefresh = false;
  let recreateCount = 0;
  let refreshCount = 0;

  while (Date.now() < timeoutAt) {
    let tab = null;

    try {
      tab = await chrome.tabs.get(tabId);
    } catch (error) {
      throw new SalesCenterRequestError(
        "A aba temporaria SalesCloud foi fechada antes da preparacao.",
        410,
        requestContext.debug,
        {
          code: "SESSION_BOOTSTRAP_UNAVAILABLE",
          details: error?.message || String(error),
        },
      );
    }

    if (shouldNavigateBootstrapTabToSalesCloud(tab)) {
      await refreshSalesCloudTab(requestContext, tabId, {
        href: tab.url || null,
        reason: "bootstrap origin loaded",
        refreshCount,
      });
      firstIncompleteAt = Date.now();
      await delay(1500);
      continue;
    }

    const frame = await inspectSalesCloudTabFrame(requestContext, tabId);

    if (frame?.pageLooksUnauthorized) {
      if (refreshCount < SESSION_SALES_CLOUD_TAB_MAX_REFRESHES) {
        refreshCount += 1;
        await refreshSalesCloudTab(requestContext, tabId, {
          href: frame.href,
          reason: "SalesCloud page showed 401",
          refreshCount,
        });
        firstIncompleteAt = Date.now();
        await delay(2000);
        continue;
      }

      if (recreateCount < SESSION_SALES_CLOUD_TAB_MAX_RECREATES) {
        recreateCount += 1;
        tabId = await recreateTemporarySalesCloudTab(requestContext, tabId, {
          href: frame.href,
          reason: "SalesCloud page stayed on 401 after refreshes",
          recreateCount,
        });
        firstIncompleteAt = null;
        forcedStabilizationRefresh = false;
        refreshCount = 0;
        await delay(1500);
        continue;
      }

      throw new SalesCenterRequestError(
        "SalesCloudSMC-GEC continuou retornando 401 apos refresh automatico.",
        401,
        requestContext.debug,
        { code: "SESSION_BOOTSTRAP_UNAVAILABLE" },
      );
    }

    if (frame?.readyState === "complete") {
      if (!forcedStabilizationRefresh && refreshCount < SESSION_SALES_CLOUD_TAB_MAX_REFRESHES) {
        forcedStabilizationRefresh = true;
        refreshCount += 1;
        await refreshSalesCloudTab(requestContext, tabId, {
          href: frame.href,
          reason: "first complete stabilization refresh",
          refreshCount,
        });
        firstIncompleteAt = Date.now();
        await delay(1500);
        continue;
      }

      await delay(SESSION_SALES_CLOUD_API_PROBE_AFTER_COMPLETE_MS);
      if (!await probeSalesCloudApiReadyOnce(requestContext, tabId, frame.frameId)) {
        if (refreshCount < SESSION_SALES_CLOUD_TAB_MAX_REFRESHES) {
          refreshCount += 1;
          await refreshSalesCloudTab(requestContext, tabId, {
            href: frame.href,
            reason: "API probe returned session HTML",
            refreshCount,
          });
          firstIncompleteAt = Date.now();
          await delay(1500);
          continue;
        }

        if (recreateCount < SESSION_SALES_CLOUD_TAB_MAX_RECREATES) {
          recreateCount += 1;
          tabId = await recreateTemporarySalesCloudTab(requestContext, tabId, {
            href: frame.href,
            reason: "API probe stayed unauthorized after refreshes",
            recreateCount,
          });
          firstIncompleteAt = null;
          forcedStabilizationRefresh = false;
          refreshCount = 0;
          await delay(1500);
          continue;
        }

        await delay(1000);
        continue;
      }

      return {
        frameId: frame.frameId,
        href: frame.href,
        readyState: frame.readyState,
        tabId,
      };
    }

    if (!firstIncompleteAt) {
      firstIncompleteAt = Date.now();
    }

    if (
      Date.now() - firstIncompleteAt >= SESSION_SALES_CLOUD_TAB_REFRESH_AFTER_MS &&
      refreshCount < SESSION_SALES_CLOUD_TAB_MAX_REFRESHES
    ) {
      refreshCount += 1;
      await refreshSalesCloudTab(requestContext, tabId, {
        href: frame?.href || tab.url || null,
        reason: frame ? "incomplete readyState" : "frame not ready",
        refreshCount,
      });
      firstIncompleteAt = Date.now();
    }

    await delay(750);
  }

  throw new SalesCenterRequestError(
    "SalesCloudSMC-GEC nao terminou de carregar no contexto temporario.",
    408,
    requestContext.debug,
    { code: "SESSION_BOOTSTRAP_TIMEOUT" },
  );
}

async function inspectSalesCloudTabFrame(requestContext, tabId) {
  try {
    const frames = await chrome.scripting.executeScript({
      func: () => ({
        bodyPreview: document.body?.innerText?.slice(0, 1000) || "",
        href: window.location.href,
        readyState: document.readyState,
        title: document.title,
      }),
      target: { allFrames: true, tabId },
    });

    const frame = frames.find(
      (candidate) =>
        candidate.result?.href?.startsWith(SESSION_SALES_CLOUD_REFERER) &&
        candidate.result?.readyState === "complete",
    ) || frames.find(
      (candidate) =>
        candidate.result?.href?.startsWith(`${SESSION_API_ORIGIN}/oalcrm/web/`) &&
        candidate.result?.readyState === "complete",
    ) || frames.find(
      (candidate) =>
        candidate.result?.href?.startsWith(`${SESSION_API_ORIGIN}/oalcrm/web/`),
    );

    if (!frame?.result) {
      return null;
    }

    requestContext.debug.sessionRecovery.push({
      frameId: frame.frameId,
      href: frame.result.href,
      pageLooksUnauthorized: looksLikeUnauthorizedPage(
        frame.result.title,
        frame.result.bodyPreview,
      ),
      readyState: frame.result.readyState,
      step: "inspectSalesCloudTabFrame",
      tabId,
      title: frame.result.title || "",
    });

    return {
      frameId: frame.frameId,
      href: frame.result.href,
      pageLooksUnauthorized: looksLikeUnauthorizedPage(
        frame.result.title,
        frame.result.bodyPreview,
      ),
      readyState: frame.result.readyState,
    };
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      error: error?.message || String(error),
      step: "inspectSalesCloudTabFrame",
      tabId,
    });
    return null;
  }
}

async function probeSalesCloudApiReadyOnce(requestContext, tabId, frameId) {
  try {
    const [executionResult] = await chrome.scripting.executeScript({
      args: [
        {
          headers: {
            Accept: "application/json, text/javascript, */*; q=0.01",
            "Accept-Language": "pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7",
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
          },
          url: getForecastActiveUrl(),
        },
      ],
      func: async ({ headers, url }) => {
        const response = await fetch(url, {
          cache: "no-store",
          credentials: "include",
          headers,
          method: "GET",
        });
        const text = await response.text();
        const preview = text.slice(0, 500);
        const normalizedPreview = preview.trim().toLowerCase();
        const looksLikeHtml =
          normalizedPreview.startsWith("<!doctype") ||
          normalizedPreview.startsWith("<html") ||
          normalizedPreview.includes("<html") ||
          normalizedPreview.includes("<form") ||
          normalizedPreview.includes("login") ||
          normalizedPreview.includes("signin");
        let jsonReady = false;

        if (!looksLikeHtml && text.trim()) {
          try {
            let preparedText = text.trim().replace(/^\uFEFF/, "");
            for (const guard of [")]}'", ")]}',", "while(1);", "for(;;);"]) {
              if (preparedText.startsWith(guard)) {
                preparedText = preparedText.slice(guard.length).trim();
                break;
              }
            }

            JSON.parse(preparedText);
            jsonReady = true;
          } catch (error) {
            jsonReady = false;
          }
        }

        return {
          bodySize: text.length,
          contentType: response.headers.get("content-type") || "",
          ok: response.ok,
          preview,
          ready: response.ok && jsonReady,
          sessionHtml: looksLikeHtml,
          status: response.status,
          statusText: response.statusText,
        };
      },
      target: {
        frameIds: [frameId],
        tabId,
      },
      world: "MAIN",
    });
    const result = executionResult?.result || null;

    requestContext.debug.sessionRecovery.push({
      bodySize: result?.bodySize || 0,
      contentType: result?.contentType || "",
      frameId,
      ok: result?.ok === true,
      ready: result?.ready === true,
      sessionHtml: result?.sessionHtml === true,
      status: result?.status || null,
      step: "probeSalesCloudApiReadyOnce",
      tabId,
    });

    return result?.ready === true;
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      error: error?.message || String(error),
      frameId,
      step: "probeSalesCloudApiReadyOnce",
      tabId,
    });
    return false;
  }
}

async function refreshSalesCloudTab(requestContext, tabId, details) {
  try {
    const tab = await chrome.tabs.get(tabId);

    if (tab.url?.startsWith(SESSION_SALES_CLOUD_REFERER)) {
      await chrome.tabs.reload(tabId, { bypassCache: true });
    } else {
      await chrome.tabs.update(tabId, { url: SESSION_SALES_CLOUD_REFERER });
    }

    requestContext.debug.sessionRecovery.push({
      ...details,
      step: "refreshSalesCloudTab",
      triggeredAt: new Date().toISOString(),
      tabId,
    });
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      ...details,
      error: error?.message || String(error),
      step: "refreshSalesCloudTab",
      triggeredAt: new Date().toISOString(),
      tabId,
    });
  }
}

function shouldNavigateBootstrapTabToSalesCloud(tab) {
  const url = tab?.url || "";

  return (
    tab?.status === "complete" &&
    (
      url === SESSION_SALES_CLOUD_BOOTSTRAP_URL ||
      url === SESSION_API_ORIGIN ||
      (
        url.startsWith(SESSION_API_ORIGIN) &&
        !url.startsWith(`${SESSION_API_ORIGIN}/oalcrm/web/`)
      ) ||
      url.startsWith("chrome-error://")
    )
  );
}

async function recreateTemporarySalesCloudTab(requestContext, currentTabId, details) {
  try {
    await chrome.tabs.remove(currentTabId);
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      ...details,
      error: error?.message || String(error),
      step: "removeTemporarySalesCloudTabBeforeRecreate",
      tabId: currentTabId,
    });
  }

  try {
    const tab = await chrome.tabs.create({
      active: false,
      url: SESSION_SALES_CLOUD_BOOTSTRAP_URL,
    });
    requestContext.temporarySalesCloudTabId = tab.id;
    requestContext.debug.sessionRecovery.push({
      ...details,
      newTabId: tab.id,
      previousTabId: currentTabId,
      step: "recreateTemporarySalesCloudTab",
      triggeredAt: new Date().toISOString(),
    });
    return tab.id;
  } catch (error) {
    throw new SalesCenterRequestError(
      "Nao foi possivel recriar o contexto temporario SalesCloud.",
      500,
      requestContext.debug,
      {
        code: "SESSION_BOOTSTRAP_UNAVAILABLE",
        details: error?.message || String(error),
      },
    );
  }
}

async function closeTemporarySalesCloudTab(requestContext) {
  const tabId = requestContext.temporarySalesCloudTabId;

  if (!tabId) {
    return;
  }

  requestContext.temporarySalesCloudTabId = null;

  try {
    await chrome.tabs.remove(tabId);
    requestContext.debug.sessionRecovery.push({
      closedAt: new Date().toISOString(),
      step: "closeTemporarySalesCloudTab",
      tabId,
    });
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      error: error?.message || String(error),
      step: "closeTemporarySalesCloudTab",
      tabId,
    });
  }
}

async function findExistingSalesCloudTabContext(requestContext) {
  let tabs = [];

  try {
    tabs = await chrome.tabs.query({ url: `${SESSION_API_ORIGIN}/*` });
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      error: error?.message || String(error),
      step: "findExistingSalesCloudTabContext",
    });
    return null;
  }

  for (const tab of tabs) {
    if (!tab.id || tab.id === requestContext.tabId) {
      continue;
    }

    try {
      const frames = await chrome.scripting.executeScript({
        func: () => ({
          href: window.location.href,
          readyState: document.readyState,
        }),
        target: { allFrames: true, tabId: tab.id },
      });
      const frame = frames.find(
        (candidate) =>
          candidate.result?.href?.startsWith(SESSION_SALES_CLOUD_REFERER) &&
          candidate.result?.readyState === "complete",
      ) || frames.find(
        (candidate) =>
          candidate.result?.href?.startsWith(`${SESSION_API_ORIGIN}/oalcrm/web/`) &&
          candidate.result?.readyState === "complete",
      );

      if (frame) {
        return {
          frameId: frame.frameId,
          href: frame.result.href,
          readyState: frame.result.readyState,
          tabId: tab.id,
        };
      }
    } catch (error) {
      requestContext.debug.sessionRecovery.push({
        error: error?.message || String(error),
        step: "inspectExistingSalesCloudTab",
        tabId: tab.id,
      });
    }
  }

  return null;
}

async function waitForSalesCloudFrame(requestContext) {
  if (!requestContext.tabId || !requestContext.debug?.frameName) {
    throw new SalesCenterRequestError(
      "Contexto do iframe SalesCloudSMC-GEC nÃ£o foi informado.",
      400,
      requestContext.debug,
    );
  }

  const timeoutAt = Date.now() + 60000;
  let firstIncompleteAt = null;
  let forcedStabilizationRefresh = false;
  let lastFrameId = null;
  let refreshCount = 0;

  while (Date.now() < timeoutAt) {
    const frames = await chrome.scripting.executeScript({
      func: () => ({
        frameName: window.name || "",
        href: window.location.href,
        readyState: document.readyState,
      }),
      target: { allFrames: true, tabId: requestContext.tabId },
    });
    const namedFrame = frames.find(
      (frame) => frame.result?.frameName === requestContext.debug.frameName,
    );
    const salesCloudFrame = frames.find(
      (frame) =>
        frame.result?.frameName === requestContext.debug.frameName &&
        frame.result?.href?.startsWith(SESSION_SALES_CLOUD_REFERER),
    );

    if (salesCloudFrame?.result?.readyState === "complete") {
      if (!forcedStabilizationRefresh && refreshCount < SESSION_SALES_CLOUD_FRAME_MAX_REFRESHES) {
        forcedStabilizationRefresh = true;
        refreshCount += 1;
        await refreshSalesCloudFrame(requestContext, {
          href: salesCloudFrame.result.href,
          reason: "first complete stabilization refresh",
          refreshCount,
        });
        firstIncompleteAt = Date.now();
        await delay(1000);
        continue;
      }

      requestContext.debug.sessionFrame = {
        frameId: salesCloudFrame.frameId,
        href: salesCloudFrame.result.href,
        readyState: salesCloudFrame.result.readyState,
      };
      return salesCloudFrame.frameId;
    }

    const refreshCandidate = salesCloudFrame || namedFrame;

    if (refreshCandidate?.result) {
      requestContext.debug.sessionFrame = {
        frameId: refreshCandidate.frameId,
        href: refreshCandidate.result.href,
        readyState: refreshCandidate.result.readyState,
      };

      if (lastFrameId !== refreshCandidate.frameId) {
        firstIncompleteAt = Date.now();
        lastFrameId = refreshCandidate.frameId;
      } else if (!firstIncompleteAt) {
        firstIncompleteAt = Date.now();
      }

      if (
        Date.now() - firstIncompleteAt >= SESSION_SALES_CLOUD_FRAME_REFRESH_AFTER_MS &&
        refreshCount < SESSION_SALES_CLOUD_FRAME_MAX_REFRESHES
      ) {
        refreshCount += 1;
        await refreshSalesCloudFrame(requestContext, {
          href: refreshCandidate.result.href,
          reason: refreshCandidate.result.readyState === "complete"
            ? "unexpected href"
            : "incomplete readyState",
          refreshCount,
        });
        firstIncompleteAt = Date.now();
      }
    }

    await delay(500);
  }

  throw new SalesCenterRequestError(
    "Iframe SalesCloudSMC-GEC nÃ£o terminou de carregar.",
    408,
    requestContext.debug,
  );
}

async function refreshSalesCloudFrame(requestContext, details) {
  try {
    const [executionResult] = await chrome.scripting.executeScript({
      args: [
        {
          frameName: requestContext.debug.frameName,
          src: SESSION_SALES_CLOUD_REFERER,
        },
      ],
      func: ({ frameName, src }) => {
        const frame = Array.from(document.querySelectorAll("iframe")).find(
          (candidate) => candidate.name === frameName,
        );

        if (!frame) {
          return { refreshed: false, reason: "frame not found" };
        }

        frame.dataset.loaded = "false";
        frame.src = src;
        return { refreshed: true, src };
      },
      target: { tabId: requestContext.tabId },
    });

    requestContext.debug.sessionRecovery.push({
      ...details,
      result: executionResult?.result || null,
      step: "refreshSalesCloudFrame",
      triggeredAt: new Date().toISOString(),
    });
  } catch (error) {
    requestContext.debug.sessionRecovery.push({
      ...details,
      error: error?.message || String(error),
      step: "refreshSalesCloudFrame",
      triggeredAt: new Date().toISOString(),
    });
  }
}

globalThis.SalesCenterBackgroundRuntime = {
  ...(globalThis.SalesCenterBackgroundRuntime || {}),
  closeTemporarySalesCloudTab,
  createTemporarySalesCloudTabContext,
  ensureSalesCloudExecutionContext,
  findExistingSalesCloudTabContext,
  prepareSalesCloudFrameStorageAccess,
  probeSalesCloudApiReadyOnce,
  refreshSalesCloudFrame,
  refreshSalesCloudTab,
  warmSalesCloudSession,
};
