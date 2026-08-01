const assert = require("assert");
const path = require("path");
const vm = require("vm");
const fs = require("fs");

const code = fs.readFileSync(path.join(__dirname, "../src/js/engine.js"), "utf8");
const sandbox = { window: {}, console };
vm.runInNewContext(code, sandbox);
const engine = sandbox.window.MeridianEngine;

assert.ok(engine, "engine should load");

const empty = engine.analyze([], "moderate");
assert.strictEqual(empty.empty, true);

const result = engine.analyze(engine.DEMO_HOLDINGS, "moderate");
assert.strictEqual(result.empty, false);
assert.ok(result.total > 90000);
assert.ok(result.scores.overall >= 0 && result.scores.overall <= 100);
assert.ok(result.recommendations.length >= 2);
assert.ok(result.allocationRows.some((r) => r.id === "us_equity"));

const cashHeavy = engine.analyze(
  [
    { name: "Cash", assetClass: "cash", amount: 80000, expenseRatio: 0 },
    { name: "VTI", assetClass: "us_equity", amount: 20000, expenseRatio: 0.03 },
  ],
  "growth"
);
assert.ok(
  cashHeavy.recommendations.some((r) => /cash/i.test(r.title)),
  "should recommend reducing cash drag for growth"
);

const concentrated = engine.analyze(
  [{ name: "AAPL", assetClass: "us_equity", amount: 100000, expenseRatio: 0 }],
  "moderate"
);
assert.ok(
  concentrated.recommendations.some((r) => /concentrated|Trim/i.test(r.title)),
  "should flag concentration"
);

console.log("engine.test.js: all checks passed");