"use strict";

const assert = require("node:assert/strict");

require("../src/background/cache/requestDeduplicator.js");

(async () => {
  const deduplicator = SalesCenterBackgroundCache.createRequestDeduplicator();
  let callCount = 0;
  const load = async () => {
    callCount += 1;
    await new Promise((resolve) => setTimeout(resolve, 5));
    return "ok";
  };

  const [first, second] = await Promise.all([
    deduplicator.run("same-key", load),
    deduplicator.run("same-key", load),
  ]);

  assert.equal(first, "ok");
  assert.equal(second, "ok");
  assert.equal(callCount, 1);

  await deduplicator.run("same-key", load);
  assert.equal(callCount, 2);

  console.log("requestDeduplicator.test.js passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
