"use strict";

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parseJsonResponse(text, url, status, debug, label) {
  const preparedText = prepareJsonText(text);

  try {
    return JSON.parse(preparedText);
  } catch (error) {
    const code = looksLikeHtmlResponse(text) ? "SESSION_HTML" : "INVALID_JSON";
    const message =
      code === "SESSION_HTML"
        ? "Sessao gxpap-e.oracle.com indisponivel ou expirada."
        : `Resposta JSON invalida de ${new URL(url).pathname}.`;

    throw new SalesCenterRequestError(message, status, debug, {
      code,
      label,
    });
  }
}

function prepareJsonText(text) {
  let preparedText = String(text || "").trim().replace(/^\uFEFF/, "");
  const jsonGuards = [")]}'", ")]}',", "while(1);", "for(;;);"];

  for (const guard of jsonGuards) {
    if (preparedText.startsWith(guard)) {
      preparedText = preparedText.slice(guard.length).trim();
      break;
    }
  }

  return preparedText;
}

function looksLikeHtmlResponse(text) {
  const preparedText = String(text || "").trim().slice(0, 500).toLowerCase();
  return (
    preparedText.startsWith("<!doctype") ||
    preparedText.startsWith("<html") ||
    preparedText.includes("<html") ||
    preparedText.includes("<form") ||
    preparedText.includes("login") ||
    preparedText.includes("signin")
  );
}

function looksLikeUnauthorizedPage(title, bodyText) {
  const text = `${title || ""}\n${bodyText || ""}`.toLowerCase();
  return (
    text.includes("401") ||
    text.includes("unauthorized") ||
    text.includes("not authorized") ||
    text.includes("authorization required") ||
    text.includes("access denied")
  );
}

function isRecoverableSessionError(error) {
  return (
    error instanceof SalesCenterRequestError &&
    (
      error.code === "SESSION_HTML" ||
      error.code === "SESSION_HTTP" ||
      error.code === "SESSION_BOOTSTRAP_NOT_READY" ||
      error.code === "SESSION_BOOTSTRAP_TIMEOUT" ||
      error.code === "SESSION_EXECUTION_UNAVAILABLE" ||
      error.status === 401 ||
      error.status === 403
    )
  );
}

function buildRequestErrorMessage(response, text) {
  if (response.status === 401 || response.status === 403) {
    return "Sessao gxpap-e.oracle.com indisponivel ou expirada.";
  }

  if (response.status === 404 && looksLikeBootstrapNotReadyResponse(text)) {
    return "SalesCloudSMC-GEC ainda nao terminou de montar a sessao.";
  }

  const excerpt = text ? ` ${text.slice(0, 160)}` : "";
  return `Request falhou com HTTP ${response.status}.${excerpt}`;
}

function looksLikeBootstrapNotReadyResponse(text) {
  const preparedText = String(text || "").slice(0, 500).toLowerCase();

  return (
    looksLikeHtmlResponse(text) ||
    preparedText.includes("404") ||
    preparedText.includes("not found") ||
    preparedText.includes("cannot get")
  );
}

globalThis.SalesCenterBackgroundRuntime = {
  ...(globalThis.SalesCenterBackgroundRuntime || {}),
  buildRequestErrorMessage,
  delay,
  isRecoverableSessionError,
  looksLikeHtmlResponse,
  looksLikeBootstrapNotReadyResponse,
  looksLikeUnauthorizedPage,
  parseJsonResponse,
  prepareJsonText,
};
