import assert from "node:assert/strict";
import { test } from "node:test";
import { depression, depressionNonInteractive } from "../../src/stages/depression.ts";
import { createSigintController } from "../../src/stages/mod.ts";

test("depressionNonInteractive: runs without error", () => {
  depressionNonInteractive();
});

test("depression: aborting the signal skips the rest of the stage", async () => {
  const controller = new AbortController();
  const start = performance.now();
  const run = depression("slow", controller.signal);
  setTimeout(() => controller.abort(), 20);
  await run;
  // Slow speed takes ~13s uninterrupted; an abort must end it promptly.
  assert.ok(performance.now() - start < 1000, "depression should end soon after abort");
});

test("depression: SIGINT controller aborts a running depression stage", async () => {
  const sigint = createSigintController();
  const signal = sigint.beginSkippable();
  const start = performance.now();
  const run = depression("slow", signal);
  setTimeout(() => sigint.handler(), 20);
  await run;
  sigint.endSkippable();
  assert.ok(signal.aborted);
  assert.ok(performance.now() - start < 1000, "Ctrl+C should skip depression");
});

test("createSigintController: SIGINT outside a skippable stage aborts nothing", () => {
  const sigint = createSigintController();
  sigint.handler();
  const signal = sigint.beginSkippable();
  assert.equal(signal.aborted, false);
  sigint.endSkippable();
  sigint.handler();
  assert.equal(signal.aborted, false);
});
