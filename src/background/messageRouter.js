"use strict";

function createMessageRouter({ handlers, normalizeError }) {
  function handle(message, sender, sendResponse) {
    const handler = handlers[message?.type];
    if (!handler) {
      return false;
    }

    Promise.resolve()
      .then(() => handler(message, sender))
      .then((result) => {
        sendResponse({
          data: result,
          meta: {
            cache: result?.cache || null,
          },
          ok: true,
        });
      })
      .catch((error) => {
        sendResponse({
          debug: error?.debug || null,
          error: normalizeError(error),
          ok: false,
        });
      });

    return true;
  }

  return { handle };
}

globalThis.SalesCenterBackground = {
  ...(globalThis.SalesCenterBackground || {}),
  createMessageRouter,
};
