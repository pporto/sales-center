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
    const code = response.status === 404 && looksLikeBootstrapNotReadyResponse(text)
      ? "SESSION_BOOTSTRAP_NOT_READY"
      : response.status === 401 || response.status === 403
        ? "SESSION_HTTP"
        : "HTTP_ERROR";

    throw new SalesCenterRequestError(
      buildRequestErrorMessage(response, text),
      response.status,
      requestContext.debug,
      {
        code,
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

  const preparedFrameResult = await retryFetchJsonInPreparedFrame(
    requestContext,
    label,
    url,
    options,
    {
      attempts: 3,
      baseDelayMs: 700,
      labelSuffix: "frameRetry",
    },
  );

  if (preparedFrameResult.ok) {
    return preparedFrameResult.data;
  }

  const retryError = preparedFrameResult.error;

  if (!isRecoverableSessionError(retryError)) {
    throw retryError;
  }

  if (requestContext.temporarySalesCloudTabId) {
    await refreshSalesCloudTab(requestContext, requestContext.temporarySalesCloudTabId, {
      href: requestContext.debug.executionContext?.href || null,
      reason: retryError.message,
    });
    await createTemporarySalesCloudTabContext(requestContext, {
      reason: retryError.message,
    });
    await warmSalesCloudSession(requestContext);

    const refreshedFrameResult = await retryFetchJsonInPreparedFrame(
      requestContext,
      label,
      url,
      options,
      {
        attempts: 2,
        baseDelayMs: 1000,
        labelSuffix: "temporaryTabRefreshRetry",
      },
    );

    if (refreshedFrameResult.ok) {
      return refreshedFrameResult.data;
    }

    if (!isRecoverableSessionError(refreshedFrameResult.error)) {
      throw refreshedFrameResult.error;
    }

    requestContext.debug.sessionRecovery.push({
      error: refreshedFrameResult.error.message,
      label,
      step: "temporaryTabRefreshRetryFailed",
    });
  }

  const extensionLabel = `${label}:extensionFetch`;
  recordRequestStart(requestContext.debug, extensionLabel, url, options);
  const extensionResponse = await fetchJsonInExtensionContext(url, options);
  recordRequestEnd(requestContext.debug, extensionLabel, extensionResponse);
  return parseFetchJsonResponse(requestContext, label, url, extensionResponse);
}

async function retryFetchJsonInPreparedFrame(
  requestContext,
  label,
  url,
  options,
  retryOptions,
) {
  let lastError = null;
  const attempts = Math.max(1, retryOptions.attempts || 1);
  const baseDelayMs = Math.max(0, retryOptions.baseDelayMs || 0);

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const attemptLabel = `${label}:${retryOptions.labelSuffix}${attempt > 1 ? attempt : ""}`;
    recordRequestStart(requestContext.debug, attemptLabel, url, options);

    try {
      const response = await fetchJsonInSalesCloudFrame(requestContext, url, options);
      recordRequestEnd(requestContext.debug, attemptLabel, response);
      return {
        data: parseFetchJsonResponse(requestContext, label, url, response),
        ok: true,
      };
    } catch (error) {
      lastError = error;

      if (!isRecoverableSessionError(error) || attempt === attempts) {
        break;
      }

      requestContext.debug.sessionRecovery.push({
        attempt,
        error: error.message,
        label,
        nextDelayMs: baseDelayMs * attempt,
        step: retryOptions.labelSuffix,
      });
      await delay(baseDelayMs * attempt);
      await warmSalesCloudSession(requestContext);
    }
  }

  return {
    error: lastError,
    ok: false,
  };
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
