"use strict";

function createChromeRuntimeAdapter() {
  return {
    sendMessage(message) {
      return new Promise((resolve, reject) => {
        if (
          typeof chrome === "undefined" ||
          !chrome.runtime ||
          !chrome.runtime.sendMessage
        ) {
          reject(new Error("Chrome runtime indisponivel para esta pagina."));
          return;
        }

        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }

          resolve(response);
        });
      });
    },
  };
}

globalThis.SalesCenterInfra = {
  ...(globalThis.SalesCenterInfra || {}),
  createChromeRuntimeAdapter,
};
