"use strict";

var SMC_HTTP_SALES_CLOUD_REFERER = SalesCenterConstants.SALES_CLOUD_REFERER;

async function fetchJson(requestContext, label, url, options) {
  recordRequestStart(requestContext.debug, label, url, options);

  try {
    const response = await fetchJsonInSalesCloudFrame(
      requestContext,
      url,
      options,
    );
    recordRequestEnd(requestContext.debug, label, response);
    return parseFetchJsonResponse(requestContext, label, url, response);
  } catch (error) {
    if (!isRecoverableSessionError(error)) {
      throw error;
    }

    return retryFetchJsonWithAvailableSession(
      requestContext,
      label,
      url,
      options,
      error,
    );
  }
}

function parseFetchJsonResponse(requestContext, label, url, response) {
  const text = response.text;

  if (!response.ok) {
    throw new SalesCenterRequestError(
      buildRequestErrorMessage(response, text),
      response.status,
      requestContext.debug,
      {
        code: response.status === 401 || response.status === 403
          ? "SESSION_HTTP"
          : "HTTP_ERROR",
        label,
      },
    );
  }

  if (!text) {
    return null;
  }

  return parseJsonResponse(text, url, response.status, requestContext.debug, label);
}

async function retryFetchJsonWithAvailableSession(
  requestContext,
  label,
  url,
  options,
  firstError,
) {
  requestContext.debug.sessionRecovery.push({
    firstError: firstError.message,
    label,
    startedAt: new Date().toISOString(),
  });

  await ensureSalesCloudExecutionContext(requestContext, {
    forceTemporaryTab: true,
    reason: firstError.message,
  });
  await warmSalesCloudSession(requestContext);

  const retryLabel = `${label}:frameRetry`;
  recordRequestStart(requestContext.debug, retryLabel, url, options);

  try {
    const retryResponse = await fetchJsonInSalesCloudFrame(requestContext, url, options);
    recordRequestEnd(requestContext.debug, retryLabel, retryResponse);
    return parseFetchJsonResponse(requestContext, label, url, retryResponse);
  } catch (retryError) {
    if (!isRecoverableSessionError(retryError)) {
      throw retryError;
    }

    if (requestContext.temporarySalesCloudTabId) {
      await createTemporarySalesCloudTabContext(requestContext, {
        reason: retryError.message,
      });

      const refreshedRetryLabel = `${label}:temporaryTabRefreshRetry`;
      recordRequestStart(requestContext.debug, refreshedRetryLabel, url, options);

      try {
        const refreshedRetryResponse = await fetchJsonInSalesCloudFrame(
          requestContext,
          url,
          options,
        );
        recordRequestEnd(
          requestContext.debug,
          refreshedRetryLabel,
          refreshedRetryResponse,
        );
        return parseFetchJsonResponse(
          requestContext,
          label,
          url,
          refreshedRetryResponse,
        );
      } catch (refreshedRetryError) {
        if (!isRecoverableSessionError(refreshedRetryError)) {
          throw refreshedRetryError;
        }

        requestContext.debug.sessionRecovery.push({
          error: refreshedRetryError.message,
          label,
          step: "temporaryTabRefreshRetryFailed",
        });
      }
    }

    const extensionLabel = `${label}:extensionFetch`;
    recordRequestStart(requestContext.debug, extensionLabel, url, options);
    const extensionResponse = await fetchJsonInExtensionContext(url, options);
    recordRequestEnd(requestContext.debug, extensionLabel, extensionResponse);
    return parseFetchJsonResponse(requestContext, label, url, extensionResponse);
  }
}

async function fetchJsonInSalesCloudFrame(requestContext, url, options) {
  let executionResult;

  try {
    [executionResult] = await chrome.scripting.executeScript({
      args: [
        {
          fetchOptions: {
            body: options.body || null,
            headers: options.headers || {},
            method: options.method || "GET",
          },
          url,
        },
      ],
      func: async ({ url: requestUrl, fetchOptions }) => {
        const response = await fetch(requestUrl, {
          body: fetchOptions.body,
          cache: "no-store",
          credentials: "include",
          headers: fetchOptions.headers,
          method: fetchOptions.method,
        });
        const text = await response.text();

        return {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          text,
        };
      },
      target: {
        frameIds: [requestContext.executionFrameId ?? requestContext.frameId],
        tabId: requestContext.executionTabId ?? requestContext.tabId,
      },
      world: "MAIN",
    });
  } catch (error) {
    throw new SalesCenterRequestError(
      "Nao foi possivel executar a request no contexto SalesCloud.",
      500,
      requestContext.debug,
      {
        code: "SESSION_EXECUTION_UNAVAILABLE",
        details: error?.message || String(error),
      },
    );
  }

  if (!executionResult?.result) {
    throw new SalesCenterRequestError(
      "Nao foi possivel executar a request no contexto SalesCloud.",
      500,
      requestContext.debug,
      { code: "SESSION_EXECUTION_UNAVAILABLE" },
    );
  }

  return executionResult.result;
}

async function fetchJsonInExtensionContext(url, options) {
  const response = await fetch(url, {
    body: options.body || null,
    cache: "no-store",
    credentials: "include",
    headers: options.headers || {},
    method: options.method || "GET",
    referrer: SMC_HTTP_SALES_CLOUD_REFERER,
    referrerPolicy: "strict-origin-when-cross-origin",
  });
  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    text,
  };
}

globalThis.SalesCenterBackgroundRuntime = {
  ...(globalThis.SalesCenterBackgroundRuntime || {}),
  fetchJson,
  fetchJsonInExtensionContext,
  fetchJsonInSalesCloudFrame,
  parseFetchJsonResponse,
  retryFetchJsonWithAvailableSession,
};
