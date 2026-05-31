"use strict";

class SalesCenterRequestError extends Error {
  constructor(message, status, debug, options = {}) {
    super(message);
    this.name = "SalesCenterRequestError";
    this.status = status;
    this.debug = debug;
    Object.assign(this, options);
  }
}

function toMessageError(error) {
  return {
    code: error?.code || null,
    details: error?.details || null,
    message: error?.message || "Falha inesperada no Sales Center.",
    name: error?.name || "Error",
    status: error?.status || null,
  };
}

globalThis.SalesCenterErrors = {
  SalesCenterRequestError,
  toMessageError,
};
globalThis.SalesCenterRequestError = SalesCenterRequestError;
