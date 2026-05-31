"use strict";

function createDebugState(sessionContext) {
  return {
    frameName: sessionContext.frameName || null,
    generatedAt: new Date().toISOString(),
    period: normalizePeriod(sessionContext.period),
    requests: [],
    revenueExtraction: [],
    sessionRecovery: [],
    sessionStrategy: "existing tab, hidden iframe, then temporary inactive SalesCloud tab",
  };
}

function publishProgress(requestContext, progress) {
  if (!requestContext.tabId || !requestContext.progressRequestId) {
    return;
  }

  const normalizedProgress = normalizeProgressValue(progress.progress);
  requestContext.progressValue = Math.max(
    requestContext.progressValue || 0,
    normalizedProgress,
  );

  try {
    const sendResult = chrome.tabs.sendMessage(requestContext.tabId, {
      progress: {
        ...progress,
        progress: requestContext.progressValue,
        requestId: requestContext.progressRequestId,
      },
      type: "salesCenter.loadingProgress",
    });

    if (sendResult?.catch) {
      sendResult.catch(() => null);
    }
  } catch (error) {
    return;
  }
}

function normalizeProgressValue(value) {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    return 0;
  }

  return Math.max(0, Math.min(99, numberValue));
}

function recordRequestStart(debug, label, url, options) {
  const entry = {
    body: parseJsonBody(options.body),
    headers: sanitizeHeaders(options.headers || {}),
    label,
    method: options.method || "GET",
    requestAt: new Date().toISOString(),
    response: null,
    url,
  };
  debug.requests.push(entry);
}

function recordRequestEnd(debug, label, response) {
  const entry = [...debug.requests]
    .reverse()
    .find((request) => request.label === label && !request.response);

  if (!entry) {
    return;
  }

  entry.response = {
    bodyPreview: response.text || "",
    bodySize: response.text ? response.text.length : 0,
    ok: response.ok,
    receivedAt: new Date().toISOString(),
    status: response.status,
    statusText: response.statusText,
  };
}

function sanitizeHeaders(headers) {
  const safeHeaders = {};

  for (const [name, value] of Object.entries(headers)) {
    if (name.toLowerCase().includes("authorization")) {
      safeHeaders[name] = value ? "[redacted]" : value;
      continue;
    }

    safeHeaders[name] = value;
  }

  return safeHeaders;
}

function parseJsonBody(body) {
  if (!body) {
    return null;
  }

  try {
    return JSON.parse(body);
  } catch (error) {
    return body;
  }
}

globalThis.SalesCenterBackgroundRuntime = {
  ...(globalThis.SalesCenterBackgroundRuntime || {}),
  createDebugState,
  normalizeProgressValue,
  parseJsonBody,
  publishProgress,
  recordRequestEnd,
  recordRequestStart,
  sanitizeHeaders,
};
