"use strict";

function createChromeStorageAdapter(area = "local") {
  const storageArea = globalThis.chrome?.storage?.[area] || null;

  return {
    async get(key) {
      if (!storageArea) {
        return undefined;
      }

      return new Promise((resolve) => {
        storageArea.get([key], (result) => {
          if (globalThis.chrome?.runtime?.lastError) {
            resolve(undefined);
            return;
          }

          resolve(result?.[key]);
        });
      });
    },

    async remove(key) {
      if (!storageArea) {
        return;
      }

      await new Promise((resolve) => {
        storageArea.remove([key], () => resolve());
      });
    },

    async set(key, value) {
      if (!storageArea) {
        return;
      }

      await new Promise((resolve) => {
        storageArea.set({ [key]: value }, () => resolve());
      });
    },
  };
}

globalThis.SalesCenterInfra = {
  ...(globalThis.SalesCenterInfra || {}),
  createChromeStorageAdapter,
};
