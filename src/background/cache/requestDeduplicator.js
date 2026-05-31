"use strict";

function createRequestDeduplicator() {
  const inFlight = new Map();

  return {
    clear() {
      inFlight.clear();
    },

    run(key, load) {
      const existingRequest = inFlight.get(key);
      if (existingRequest) {
        return existingRequest;
      }

      const request = Promise.resolve()
        .then(load)
        .finally(() => {
          if (inFlight.get(key) === request) {
            inFlight.delete(key);
          }
        });

      inFlight.set(key, request);
      return request;
    },
  };
}

globalThis.SalesCenterBackgroundCache = {
  ...(globalThis.SalesCenterBackgroundCache || {}),
  createRequestDeduplicator,
};
